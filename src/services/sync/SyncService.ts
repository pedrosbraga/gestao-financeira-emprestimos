import { supabase } from '../supabase/config';
import SQLiteService, { SyncStatus } from '../database/SQLiteService';
import { User, Client, Loan, Payment, MonthlyPayment } from '../../types';
import NetInfo from '@react-native-community/netinfo';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  conflictCount: number;
  errorCount: number;
  errors: string[];
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  id: string;
  entityType: 'user' | 'client' | 'loan' | 'payment' | 'monthly_payment';
  entityId: string;
  localData: any;
  remoteData: any;
  conflictFields: string[];
  timestamp: Date;
}

export interface SyncOptions {
  forceSync?: boolean;
  resolveConflicts?: boolean;
  conflictResolution?: 'local' | 'remote' | 'manual';
}

class SyncService {
  private isSyncing = false;
  private lastSyncDate: Date | null = null;
  private syncListeners: ((result: SyncResult) => void)[] = [];

  async initialize(): Promise<void> {
    // Set up network state listener
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isSyncing) {
        this.syncPendingChanges();
      }
    });
  }

  async syncAll(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      conflictCount: 0,
      errorCount: 0,
      errors: [],
      conflicts: []
    };

    try {
      // Check network connectivity
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        throw new Error('No network connection available');
      }

      // Sync in order: users -> clients -> loans -> payments -> monthly_payments
      await this.syncUsers(result, options);
      await this.syncClients(result, options);
      await this.syncLoans(result, options);
      await this.syncPayments(result, options);
      await this.syncMonthlyPayments(result, options);

      this.lastSyncDate = new Date();
      result.success = result.errorCount === 0;

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
      result.errorCount++;
    } finally {
      this.isSyncing = false;
      this.notifyListeners(result);
    }

    return result;
  }

  async syncPendingChanges(): Promise<SyncResult> {
    const pendingItems = await SQLiteService.getPendingSyncItems();
    
    if (pendingItems.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        conflictCount: 0,
        errorCount: 0,
        errors: [],
        conflicts: []
      };
    }

    return this.syncAll({ forceSync: true });
  }

  private async syncUsers(result: SyncResult, options: SyncOptions): Promise<void> {
    try {
      // Get local users
      const localUsers = await SQLiteService.getUsers();
      
      // Get remote users
      const { data: remoteUsers, error } = await supabase
        .from('users')
        .select('*');

      if (error) throw error;

      // Sync remote to local (download)
      for (const remoteUser of remoteUsers || []) {
        const localUser = localUsers.find(u => u.id === remoteUser.id);
        
        if (!localUser) {
          // New remote user, add to local
          await SQLiteService.insertUser(this.mapRemoteToLocalUser(remoteUser));
          await SQLiteService.updateSyncStatus('user', remoteUser.id, 'synced');
          result.syncedCount++;
        } else {
          // Check for conflicts
          const hasConflict = this.detectUserConflict(localUser, remoteUser);
          if (hasConflict && !options.resolveConflicts) {
            result.conflicts.push({
              id: `user_${remoteUser.id}`,
              entityType: 'user',
              entityId: remoteUser.id,
              localData: localUser,
              remoteData: remoteUser,
              conflictFields: this.getUserConflictFields(localUser, remoteUser),
              timestamp: new Date()
            });
            result.conflictCount++;
            await SQLiteService.updateSyncStatus('user', remoteUser.id, 'conflict', localUser, remoteUser);
          } else if (hasConflict && options.conflictResolution === 'remote') {
            // Resolve conflict by using remote data
            await SQLiteService.insertUser(this.mapRemoteToLocalUser(remoteUser));
            await SQLiteService.updateSyncStatus('user', remoteUser.id, 'synced');
            result.syncedCount++;
          }
        }
      }

      // Sync local to remote (upload)
      for (const localUser of localUsers) {
        const remoteUser = remoteUsers?.find(u => u.id === localUser.id);
        
        if (!remoteUser) {
          // New local user, upload to remote
          const { error } = await supabase
            .from('users')
            .insert(this.mapLocalToRemoteUser(localUser));
          
          if (error) throw error;
          
          await SQLiteService.updateSyncStatus('user', localUser.id, 'synced');
          result.syncedCount++;
        }
      }

    } catch (error) {
      result.errors.push(`User sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.errorCount++;
    }
  }

  private async syncClients(result: SyncResult, options: SyncOptions): Promise<void> {
    try {
      const localClients = await SQLiteService.getClients();
      
      const { data: remoteClients, error } = await supabase
        .from('clients')
        .select('*');

      if (error) throw error;

      // Sync remote to local
      for (const remoteClient of remoteClients || []) {
        const localClient = localClients.find(c => c.id === remoteClient.id);
        
        if (!localClient) {
          await SQLiteService.insertClient(this.mapRemoteToLocalClient(remoteClient));
          await SQLiteService.updateSyncStatus('client', remoteClient.id, 'synced');
          result.syncedCount++;
        } else {
          const hasConflict = this.detectClientConflict(localClient, remoteClient);
          if (hasConflict && !options.resolveConflicts) {
            result.conflicts.push({
              id: `client_${remoteClient.id}`,
              entityType: 'client',
              entityId: remoteClient.id,
              localData: localClient,
              remoteData: remoteClient,
              conflictFields: this.getClientConflictFields(localClient, remoteClient),
              timestamp: new Date()
            });
            result.conflictCount++;
            await SQLiteService.updateSyncStatus('client', remoteClient.id, 'conflict', localClient, remoteClient);
          } else if (hasConflict && options.conflictResolution === 'remote') {
            await SQLiteService.insertClient(this.mapRemoteToLocalClient(remoteClient));
            await SQLiteService.updateSyncStatus('client', remoteClient.id, 'synced');
            result.syncedCount++;
          }
        }
      }

      // Sync local to remote
      for (const localClient of localClients) {
        const remoteClient = remoteClients?.find(c => c.id === localClient.id);
        
        if (!remoteClient) {
          const { error } = await supabase
            .from('clients')
            .insert(this.mapLocalToRemoteClient(localClient));
          
          if (error) throw error;
          
          await SQLiteService.updateSyncStatus('client', localClient.id, 'synced');
          result.syncedCount++;
        }
      }

    } catch (error) {
      result.errors.push(`Client sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.errorCount++;
    }
  }

  private async syncLoans(result: SyncResult, options: SyncOptions): Promise<void> {
    try {
      const localLoans = await SQLiteService.getLoans();
      
      const { data: remoteLoans, error } = await supabase
        .from('loans')
        .select('*');

      if (error) throw error;

      // Sync remote to local
      for (const remoteLoan of remoteLoans || []) {
        const localLoan = localLoans.find(l => l.id === remoteLoan.id);
        
        if (!localLoan) {
          await SQLiteService.insertLoan(this.mapRemoteToLocalLoan(remoteLoan));
          await SQLiteService.updateSyncStatus('loan', remoteLoan.id, 'synced');
          result.syncedCount++;
        } else {
          const hasConflict = this.detectLoanConflict(localLoan, remoteLoan);
          if (hasConflict && !options.resolveConflicts) {
            result.conflicts.push({
              id: `loan_${remoteLoan.id}`,
              entityType: 'loan',
              entityId: remoteLoan.id,
              localData: localLoan,
              remoteData: remoteLoan,
              conflictFields: this.getLoanConflictFields(localLoan, remoteLoan),
              timestamp: new Date()
            });
            result.conflictCount++;
            await SQLiteService.updateSyncStatus('loan', remoteLoan.id, 'conflict', localLoan, remoteLoan);
          } else if (hasConflict && options.conflictResolution === 'remote') {
            await SQLiteService.insertLoan(this.mapRemoteToLocalLoan(remoteLoan));
            await SQLiteService.updateSyncStatus('loan', remoteLoan.id, 'synced');
            result.syncedCount++;
          }
        }
      }

      // Sync local to remote
      for (const localLoan of localLoans) {
        const remoteLoan = remoteLoans?.find(l => l.id === localLoan.id);
        
        if (!remoteLoan) {
          const { error } = await supabase
            .from('loans')
            .insert(this.mapLocalToRemoteLoan(localLoan));
          
          if (error) throw error;
          
          await SQLiteService.updateSyncStatus('loan', localLoan.id, 'synced');
          result.syncedCount++;
        }
      }

    } catch (error) {
      result.errors.push(`Loan sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.errorCount++;
    }
  }

  private async syncPayments(result: SyncResult, options: SyncOptions): Promise<void> {
    try {
      // Get all local loans to fetch their payments
      const localLoans = await SQLiteService.getLoans();
      const allLocalPayments: Payment[] = [];
      
      for (const loan of localLoans) {
        const payments = await SQLiteService.getPaymentsByLoanId(loan.id);
        allLocalPayments.push(...payments);
      }
      
      const { data: remotePayments, error } = await supabase
        .from('payments')
        .select('*');

      if (error) throw error;

      // Sync remote to local
      for (const remotePayment of remotePayments || []) {
        const localPayment = allLocalPayments.find(p => p.id === remotePayment.id);
        
        if (!localPayment) {
          await SQLiteService.insertPayment(this.mapRemoteToLocalPayment(remotePayment));
          await SQLiteService.updateSyncStatus('payment', remotePayment.id, 'synced');
          result.syncedCount++;
        } else {
          const hasConflict = this.detectPaymentConflict(localPayment, remotePayment);
          if (hasConflict && !options.resolveConflicts) {
            result.conflicts.push({
              id: `payment_${remotePayment.id}`,
              entityType: 'payment',
              entityId: remotePayment.id,
              localData: localPayment,
              remoteData: remotePayment,
              conflictFields: this.getPaymentConflictFields(localPayment, remotePayment),
              timestamp: new Date()
            });
            result.conflictCount++;
            await SQLiteService.updateSyncStatus('payment', remotePayment.id, 'conflict', localPayment, remotePayment);
          } else if (hasConflict && options.conflictResolution === 'remote') {
            await SQLiteService.insertPayment(this.mapRemoteToLocalPayment(remotePayment));
            await SQLiteService.updateSyncStatus('payment', remotePayment.id, 'synced');
            result.syncedCount++;
          }
        }
      }

      // Sync local to remote
      for (const localPayment of allLocalPayments) {
        const remotePayment = remotePayments?.find(p => p.id === localPayment.id);
        
        if (!remotePayment) {
          const { error } = await supabase
            .from('payments')
            .insert(this.mapLocalToRemotePayment(localPayment));
          
          if (error) throw error;
          
          await SQLiteService.updateSyncStatus('payment', localPayment.id, 'synced');
          result.syncedCount++;
        }
      }

    } catch (error) {
      result.errors.push(`Payment sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.errorCount++;
    }
  }

  private async syncMonthlyPayments(result: SyncResult, options: SyncOptions): Promise<void> {
    try {
      // Get current month's monthly payments
      const now = new Date();
      const localMonthlyPayments = await SQLiteService.getMonthlyPayments(now.getMonth() + 1, now.getFullYear());
      
      const { data: remoteMonthlyPayments, error } = await supabase
        .from('monthly_payments')
        .select('*')
        .gte('due_date', new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
        .lt('due_date', new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString());

      if (error) throw error;

      // Sync remote to local
      for (const remoteMonthlyPayment of remoteMonthlyPayments || []) {
        const localMonthlyPayment = localMonthlyPayments.find(mp => mp.id === remoteMonthlyPayment.id);
        
        if (!localMonthlyPayment) {
          await SQLiteService.insertMonthlyPayment(this.mapRemoteToLocalMonthlyPayment(remoteMonthlyPayment));
          await SQLiteService.updateSyncStatus('monthly_payment', remoteMonthlyPayment.id, 'synced');
          result.syncedCount++;
        } else {
          const hasConflict = this.detectMonthlyPaymentConflict(localMonthlyPayment, remoteMonthlyPayment);
          if (hasConflict && !options.resolveConflicts) {
            result.conflicts.push({
              id: `monthly_payment_${remoteMonthlyPayment.id}`,
              entityType: 'monthly_payment',
              entityId: remoteMonthlyPayment.id,
              localData: localMonthlyPayment,
              remoteData: remoteMonthlyPayment,
              conflictFields: this.getMonthlyPaymentConflictFields(localMonthlyPayment, remoteMonthlyPayment),
              timestamp: new Date()
            });
            result.conflictCount++;
            await SQLiteService.updateSyncStatus('monthly_payment', remoteMonthlyPayment.id, 'conflict', localMonthlyPayment, remoteMonthlyPayment);
          } else if (hasConflict && options.conflictResolution === 'remote') {
            await SQLiteService.insertMonthlyPayment(this.mapRemoteToLocalMonthlyPayment(remoteMonthlyPayment));
            await SQLiteService.updateSyncStatus('monthly_payment', remoteMonthlyPayment.id, 'synced');
            result.syncedCount++;
          }
        }
      }

      // Sync local to remote
      for (const localMonthlyPayment of localMonthlyPayments) {
        const remoteMonthlyPayment = remoteMonthlyPayments?.find(mp => mp.id === localMonthlyPayment.id);
        
        if (!remoteMonthlyPayment) {
          const { error } = await supabase
            .from('monthly_payments')
            .insert(this.mapLocalToRemoteMonthlyPayment(localMonthlyPayment));
          
          if (error) throw error;
          
          await SQLiteService.updateSyncStatus('monthly_payment', localMonthlyPayment.id, 'synced');
          result.syncedCount++;
        }
      }

    } catch (error) {
      result.errors.push(`Monthly payment sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.errorCount++;
    }
  }

  // Mapping functions
  private mapRemoteToLocalUser(remoteUser: any): User {
    return {
      id: remoteUser.id,
      name: remoteUser.name,
      email: remoteUser.email,
      userType: remoteUser.user_type,
      permissions: remoteUser.permissions || [],
      createdAt: new Date(remoteUser.created_at),
      lastLogin: new Date(remoteUser.last_login || remoteUser.created_at)
    };
  }

  private mapLocalToRemoteUser(localUser: User): any {
    return {
      id: localUser.id,
      name: localUser.name,
      email: localUser.email,
      user_type: localUser.userType,
      permissions: localUser.permissions,
      created_at: localUser.createdAt.toISOString(),
      last_login: localUser.lastLogin.toISOString()
    };
  }

  private mapRemoteToLocalClient(remoteClient: any): Client {
    return {
      id: remoteClient.id,
      name: remoteClient.name,
      document: remoteClient.document,
      phone: remoteClient.phone,
      address: remoteClient.address,
      references: remoteClient.references,
      createdAt: new Date(remoteClient.created_at),
      loans: []
    };
  }

  private mapLocalToRemoteClient(localClient: Client): any {
    return {
      id: localClient.id,
      name: localClient.name,
      document: localClient.document,
      phone: localClient.phone,
      address: localClient.address,
      references: localClient.references,
      created_at: localClient.createdAt.toISOString()
    };
  }

  private mapRemoteToLocalLoan(remoteLoan: any): Loan {
    return {
      id: remoteLoan.id,
      clientId: remoteLoan.client_id,
      amount: remoteLoan.amount,
      interestRate: remoteLoan.interest_rate,
      startDate: new Date(remoteLoan.start_date),
      source: remoteLoan.source,
      status: remoteLoan.status,
      remainingBalance: remoteLoan.remaining_balance,
      payments: []
    };
  }

  private mapLocalToRemoteLoan(localLoan: Loan): any {
    return {
      id: localLoan.id,
      client_id: localLoan.clientId,
      amount: localLoan.amount,
      interest_rate: localLoan.interestRate,
      start_date: localLoan.startDate.toISOString(),
      source: localLoan.source,
      status: localLoan.status,
      remaining_balance: localLoan.remainingBalance
    };
  }

  private mapRemoteToLocalPayment(remotePayment: any): Payment {
    return {
      id: remotePayment.id,
      loanId: remotePayment.loan_id,
      date: new Date(remotePayment.payment_date),
      interestAmount: remotePayment.interest_amount,
      principalAmount: remotePayment.principal_amount,
      totalAmount: remotePayment.total_amount,
      paymentType: remotePayment.payment_type
    };
  }

  private mapLocalToRemotePayment(localPayment: Payment): any {
    return {
      id: localPayment.id,
      loan_id: localPayment.loanId,
      payment_date: localPayment.date.toISOString(),
      interest_amount: localPayment.interestAmount,
      principal_amount: localPayment.principalAmount,
      total_amount: localPayment.totalAmount,
      payment_type: localPayment.paymentType
    };
  }

  private mapRemoteToLocalMonthlyPayment(remoteMonthlyPayment: any): MonthlyPayment {
    return {
      id: remoteMonthlyPayment.id,
      loanId: remoteMonthlyPayment.loan_id,
      clientName: remoteMonthlyPayment.client_name,
      dueDate: new Date(remoteMonthlyPayment.due_date),
      interestAmount: remoteMonthlyPayment.interest_amount,
      principalAmount: remoteMonthlyPayment.principal_amount,
      isPaid: remoteMonthlyPayment.is_paid,
      paidDate: remoteMonthlyPayment.paid_date ? new Date(remoteMonthlyPayment.paid_date) : undefined,
      daysOverdue: remoteMonthlyPayment.days_overdue
    };
  }

  private mapLocalToRemoteMonthlyPayment(localMonthlyPayment: MonthlyPayment): any {
    return {
      id: localMonthlyPayment.id,
      loan_id: localMonthlyPayment.loanId,
      client_name: localMonthlyPayment.clientName,
      due_date: localMonthlyPayment.dueDate.toISOString(),
      interest_amount: localMonthlyPayment.interestAmount,
      principal_amount: localMonthlyPayment.principalAmount,
      is_paid: localMonthlyPayment.isPaid,
      paid_date: localMonthlyPayment.paidDate?.toISOString(),
      days_overdue: localMonthlyPayment.daysOverdue
    };
  }

  // Conflict detection functions
  private detectUserConflict(local: User, remote: any): boolean {
    return local.name !== remote.name ||
           local.email !== remote.email ||
           local.userType !== remote.user_type;
  }

  private getUserConflictFields(local: User, remote: any): string[] {
    const conflicts: string[] = [];
    if (local.name !== remote.name) conflicts.push('name');
    if (local.email !== remote.email) conflicts.push('email');
    if (local.userType !== remote.user_type) conflicts.push('userType');
    return conflicts;
  }

  private detectClientConflict(local: Client, remote: any): boolean {
    return local.name !== remote.name ||
           local.document !== remote.document ||
           local.phone !== remote.phone ||
           JSON.stringify(local.address) !== JSON.stringify(remote.address);
  }

  private getClientConflictFields(local: Client, remote: any): string[] {
    const conflicts: string[] = [];
    if (local.name !== remote.name) conflicts.push('name');
    if (local.document !== remote.document) conflicts.push('document');
    if (local.phone !== remote.phone) conflicts.push('phone');
    if (JSON.stringify(local.address) !== JSON.stringify(remote.address)) conflicts.push('address');
    return conflicts;
  }

  private detectLoanConflict(local: Loan, remote: any): boolean {
    return local.amount !== remote.amount ||
           local.interestRate !== remote.interest_rate ||
           local.status !== remote.status ||
           local.remainingBalance !== remote.remaining_balance;
  }

  private getLoanConflictFields(local: Loan, remote: any): string[] {
    const conflicts: string[] = [];
    if (local.amount !== remote.amount) conflicts.push('amount');
    if (local.interestRate !== remote.interest_rate) conflicts.push('interestRate');
    if (local.status !== remote.status) conflicts.push('status');
    if (local.remainingBalance !== remote.remaining_balance) conflicts.push('remainingBalance');
    return conflicts;
  }

  private detectPaymentConflict(local: Payment, remote: any): boolean {
    return local.interestAmount !== remote.interest_amount ||
           local.principalAmount !== remote.principal_amount ||
           local.totalAmount !== remote.total_amount;
  }

  private getPaymentConflictFields(local: Payment, remote: any): string[] {
    const conflicts: string[] = [];
    if (local.interestAmount !== remote.interest_amount) conflicts.push('interestAmount');
    if (local.principalAmount !== remote.principal_amount) conflicts.push('principalAmount');
    if (local.totalAmount !== remote.total_amount) conflicts.push('totalAmount');
    return conflicts;
  }

  private detectMonthlyPaymentConflict(local: MonthlyPayment, remote: any): boolean {
    return local.isPaid !== remote.is_paid ||
           local.interestAmount !== remote.interest_amount ||
           local.principalAmount !== remote.principal_amount;
  }

  private getMonthlyPaymentConflictFields(local: MonthlyPayment, remote: any): string[] {
    const conflicts: string[] = [];
    if (local.isPaid !== remote.is_paid) conflicts.push('isPaid');
    if (local.interestAmount !== remote.interest_amount) conflicts.push('interestAmount');
    if (local.principalAmount !== remote.principal_amount) conflicts.push('principalAmount');
    return conflicts;
  }

  // Event listeners
  addSyncListener(listener: (result: SyncResult) => void): void {
    this.syncListeners.push(listener);
  }

  removeSyncListener(listener: (result: SyncResult) => void): void {
    const index = this.syncListeners.indexOf(listener);
    if (index > -1) {
      this.syncListeners.splice(index, 1);
    }
  }

  private notifyListeners(result: SyncResult): void {
    this.syncListeners.forEach(listener => listener(result));
  }

  // Getters
  getIsSyncing(): boolean {
    return this.isSyncing;
  }

  getLastSyncDate(): Date | null {
    return this.lastSyncDate;
  }

  async resolveConflict(conflictId: string, resolution: 'local' | 'remote'): Promise<void> {
    const [entityType, entityId] = conflictId.split('_');
    const syncStatus = await SQLiteService.getPendingSyncItems();
    const conflict = syncStatus.find(s => s.id === conflictId);

    if (!conflict) {
      throw new Error('Conflict not found');
    }

    if (resolution === 'remote' && conflict.remoteData) {
      // Apply remote data to local
      switch (entityType) {
        case 'user':
          await SQLiteService.insertUser(this.mapRemoteToLocalUser(conflict.remoteData));
          break;
        case 'client':
          await SQLiteService.insertClient(this.mapRemoteToLocalClient(conflict.remoteData));
          break;
        case 'loan':
          await SQLiteService.insertLoan(this.mapRemoteToLocalLoan(conflict.remoteData));
          break;
        case 'payment':
          await SQLiteService.insertPayment(this.mapRemoteToLocalPayment(conflict.remoteData));
          break;
        case 'monthly_payment':
          await SQLiteService.insertMonthlyPayment(this.mapRemoteToLocalMonthlyPayment(conflict.remoteData));
          break;
      }
    } else if (resolution === 'local' && conflict.localData) {
      // Upload local data to remote
      switch (entityType) {
        case 'user':
          await supabase.from('users').upsert(this.mapLocalToRemoteUser(conflict.localData));
          break;
        case 'client':
          await supabase.from('clients').upsert(this.mapLocalToRemoteClient(conflict.localData));
          break;
        case 'loan':
          await supabase.from('loans').upsert(this.mapLocalToRemoteLoan(conflict.localData));
          break;
        case 'payment':
          await supabase.from('payments').upsert(this.mapLocalToRemotePayment(conflict.localData));
          break;
        case 'monthly_payment':
          await supabase.from('monthly_payments').upsert(this.mapLocalToRemoteMonthlyPayment(conflict.localData));
          break;
      }
    }

    // Mark as resolved
    await SQLiteService.updateSyncStatus(entityType, entityId, 'synced');
  }
}

export default new SyncService();