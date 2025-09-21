import SQLite from 'react-native-sqlite-storage';
import { User, Client, Loan, Payment, MonthlyPayment } from '../../types';

// Enable debugging
SQLite.DEBUG(true);
SQLite.enablePromise(true);

export interface DatabaseConfig {
  name: string;
  version: string;
  displayName: string;
  size: number;
}

export interface SyncStatus {
  id: string;
  entityType: 'user' | 'client' | 'loan' | 'payment' | 'monthly_payment';
  entityId: string;
  status: 'synced' | 'pending' | 'conflict';
  lastModified: Date;
  localData?: any;
  remoteData?: any;
}

class SQLiteService {
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly config: DatabaseConfig = {
    name: 'GestaoFinanceira.db',
    version: '1.0',
    displayName: 'Gestão Financeira Database',
    size: 200000
  };

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase(this.config);
      await this.createTables();
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createTableQueries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users_local (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        user_type TEXT NOT NULL CHECK (user_type IN ('CEO', 'GERENTE', 'FINANCEIRO')),
        permissions TEXT, -- JSON string
        created_at TEXT NOT NULL,
        last_login TEXT,
        last_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict'))
      )`,

      // Clients table
      `CREATE TABLE IF NOT EXISTS clients_local (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        document TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL, -- JSON string
        references TEXT NOT NULL, -- JSON string
        created_at TEXT NOT NULL,
        last_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict'))
      )`,

      // Loans table
      `CREATE TABLE IF NOT EXISTS loans_local (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        amount REAL NOT NULL CHECK (amount > 0),
        interest_rate REAL NOT NULL CHECK (interest_rate >= 0),
        start_date TEXT NOT NULL,
        source TEXT NOT NULL CHECK (source IN ('INVESTIMENTO', 'CAIXA')),
        status TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'QUITADO', 'INADIMPLENTE')),
        remaining_balance REAL NOT NULL DEFAULT 0 CHECK (remaining_balance >= 0),
        created_by TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
        FOREIGN KEY (client_id) REFERENCES clients_local (id),
        FOREIGN KEY (created_by) REFERENCES users_local (id)
      )`,

      // Payments table
      `CREATE TABLE IF NOT EXISTS payments_local (
        id TEXT PRIMARY KEY,
        loan_id TEXT NOT NULL,
        payment_date TEXT NOT NULL,
        interest_amount REAL NOT NULL DEFAULT 0 CHECK (interest_amount >= 0),
        principal_amount REAL NOT NULL DEFAULT 0 CHECK (principal_amount >= 0),
        total_amount REAL NOT NULL CHECK (total_amount > 0),
        payment_type TEXT NOT NULL CHECK (payment_type IN ('JUROS', 'JUROS_PRINCIPAL')),
        received_by TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
        FOREIGN KEY (loan_id) REFERENCES loans_local (id),
        FOREIGN KEY (received_by) REFERENCES users_local (id)
      )`,

      // Monthly payments table
      `CREATE TABLE IF NOT EXISTS monthly_payments_local (
        id TEXT PRIMARY KEY,
        loan_id TEXT NOT NULL,
        client_name TEXT NOT NULL,
        due_date TEXT NOT NULL,
        interest_amount REAL NOT NULL CHECK (interest_amount > 0),
        principal_amount REAL DEFAULT 0 CHECK (principal_amount >= 0),
        is_paid INTEGER NOT NULL DEFAULT 0 CHECK (is_paid IN (0, 1)),
        paid_date TEXT,
        days_overdue INTEGER NOT NULL DEFAULT 0 CHECK (days_overdue >= 0),
        received_by TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
        FOREIGN KEY (loan_id) REFERENCES loans_local (id),
        FOREIGN KEY (received_by) REFERENCES users_local (id)
      )`,

      // Sync status table for tracking synchronization
      `CREATE TABLE IF NOT EXISTS sync_status (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'client', 'loan', 'payment', 'monthly_payment')),
        entity_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('synced', 'pending', 'conflict')),
        last_modified TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        local_data TEXT, -- JSON string
        remote_data TEXT, -- JSON string
        conflict_fields TEXT, -- JSON array of conflicting field names
        UNIQUE(entity_type, entity_id)
      )`,

      // Indexes for better performance
      `CREATE INDEX IF NOT EXISTS idx_clients_name ON clients_local (name)`,
      `CREATE INDEX IF NOT EXISTS idx_clients_document ON clients_local (document)`,
      `CREATE INDEX IF NOT EXISTS idx_loans_client_id ON loans_local (client_id)`,
      `CREATE INDEX IF NOT EXISTS idx_loans_status ON loans_local (status)`,
      `CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON payments_local (loan_id)`,
      `CREATE INDEX IF NOT EXISTS idx_payments_date ON payments_local (payment_date)`,
      `CREATE INDEX IF NOT EXISTS idx_monthly_payments_due_date ON monthly_payments_local (due_date)`,
      `CREATE INDEX IF NOT EXISTS idx_monthly_payments_is_paid ON monthly_payments_local (is_paid)`,
      `CREATE INDEX IF NOT EXISTS idx_sync_status_entity ON sync_status (entity_type, entity_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sync_status_status ON sync_status (status)`
    ];

    for (const query of createTableQueries) {
      await this.db.executeSql(query);
    }
  }

  // User operations
  async insertUser(user: User): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT OR REPLACE INTO users_local 
      (id, name, email, user_type, permissions, created_at, last_login, last_modified, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.executeSql(query, [
      user.id,
      user.name,
      user.email,
      user.userType,
      JSON.stringify(user.permissions),
      user.createdAt.toISOString(),
      user.lastLogin.toISOString(),
      new Date().toISOString(),
      'pending'
    ]);
  }

  async getUsers(): Promise<User[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql('SELECT * FROM users_local ORDER BY name');
    const users: User[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      users.push({
        id: row.id,
        name: row.name,
        email: row.email,
        userType: row.user_type,
        permissions: JSON.parse(row.permissions || '[]'),
        createdAt: new Date(row.created_at),
        lastLogin: new Date(row.last_login)
      });
    }

    return users;
  }

  // Client operations
  async insertClient(client: Client): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT OR REPLACE INTO clients_local 
      (id, name, document, phone, address, references, created_at, last_modified, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.executeSql(query, [
      client.id,
      client.name,
      client.document,
      client.phone,
      JSON.stringify(client.address),
      JSON.stringify(client.references),
      client.createdAt.toISOString(),
      new Date().toISOString(),
      'pending'
    ]);
  }

  async getClients(): Promise<Client[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql('SELECT * FROM clients_local ORDER BY name');
    const clients: Client[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      clients.push({
        id: row.id,
        name: row.name,
        document: row.document,
        phone: row.phone,
        address: JSON.parse(row.address),
        references: JSON.parse(row.references),
        createdAt: new Date(row.created_at),
        loans: [] // Will be populated separately if needed
      });
    }

    return clients;
  }

  async getClientById(id: string): Promise<Client | null> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql('SELECT * FROM clients_local WHERE id = ?', [id]);
    
    if (results.rows.length === 0) return null;

    const row = results.rows.item(0);
    return {
      id: row.id,
      name: row.name,
      document: row.document,
      phone: row.phone,
      address: JSON.parse(row.address),
      references: JSON.parse(row.references),
      createdAt: new Date(row.created_at),
      loans: await this.getLoansByClientId(id)
    };
  }

  // Loan operations
  async insertLoan(loan: Loan): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT OR REPLACE INTO loans_local 
      (id, client_id, amount, interest_rate, start_date, source, status, remaining_balance, created_at, last_modified, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.executeSql(query, [
      loan.id,
      loan.clientId,
      loan.amount,
      loan.interestRate,
      loan.startDate.toISOString(),
      loan.source,
      loan.status,
      loan.remainingBalance,
      new Date().toISOString(),
      new Date().toISOString(),
      'pending'
    ]);
  }

  async getLoans(): Promise<Loan[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql('SELECT * FROM loans_local ORDER BY start_date DESC');
    const loans: Loan[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      loans.push({
        id: row.id,
        clientId: row.client_id,
        amount: row.amount,
        interestRate: row.interest_rate,
        startDate: new Date(row.start_date),
        source: row.source,
        status: row.status,
        remainingBalance: row.remaining_balance,
        payments: [] // Will be populated separately if needed
      });
    }

    return loans;
  }

  async getLoansByClientId(clientId: string): Promise<Loan[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql(
      'SELECT * FROM loans_local WHERE client_id = ? ORDER BY start_date DESC',
      [clientId]
    );
    const loans: Loan[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      loans.push({
        id: row.id,
        clientId: row.client_id,
        amount: row.amount,
        interestRate: row.interest_rate,
        startDate: new Date(row.start_date),
        source: row.source,
        status: row.status,
        remainingBalance: row.remaining_balance,
        payments: await this.getPaymentsByLoanId(row.id)
      });
    }

    return loans;
  }

  // Payment operations
  async insertPayment(payment: Payment): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT OR REPLACE INTO payments_local 
      (id, loan_id, payment_date, interest_amount, principal_amount, total_amount, payment_type, created_at, last_modified, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.executeSql(query, [
      payment.id,
      payment.loanId,
      payment.date.toISOString(),
      payment.interestAmount,
      payment.principalAmount,
      payment.totalAmount,
      payment.paymentType,
      new Date().toISOString(),
      new Date().toISOString(),
      'pending'
    ]);
  }

  async getPaymentsByLoanId(loanId: string): Promise<Payment[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql(
      'SELECT * FROM payments_local WHERE loan_id = ? ORDER BY payment_date DESC',
      [loanId]
    );
    const payments: Payment[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      payments.push({
        id: row.id,
        loanId: row.loan_id,
        date: new Date(row.payment_date),
        interestAmount: row.interest_amount,
        principalAmount: row.principal_amount,
        totalAmount: row.total_amount,
        paymentType: row.payment_type
      });
    }

    return payments;
  }

  // Monthly payment operations
  async insertMonthlyPayment(monthlyPayment: MonthlyPayment): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT OR REPLACE INTO monthly_payments_local 
      (id, loan_id, client_name, due_date, interest_amount, principal_amount, is_paid, paid_date, days_overdue, created_at, last_modified, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.executeSql(query, [
      monthlyPayment.id,
      monthlyPayment.loanId,
      monthlyPayment.clientName,
      monthlyPayment.dueDate.toISOString(),
      monthlyPayment.interestAmount,
      monthlyPayment.principalAmount || 0,
      monthlyPayment.isPaid ? 1 : 0,
      monthlyPayment.paidDate?.toISOString() || null,
      monthlyPayment.daysOverdue,
      new Date().toISOString(),
      new Date().toISOString(),
      'pending'
    ]);
  }

  async getMonthlyPayments(month: number, year: number): Promise<MonthlyPayment[]> {
    if (!this.db) throw new Error('Database not initialized');

    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const [results] = await this.db.executeSql(
      'SELECT * FROM monthly_payments_local WHERE due_date >= ? AND due_date <= ? ORDER BY due_date',
      [startDate, endDate]
    );
    const monthlyPayments: MonthlyPayment[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      monthlyPayments.push({
        id: row.id,
        loanId: row.loan_id,
        clientName: row.client_name,
        dueDate: new Date(row.due_date),
        interestAmount: row.interest_amount,
        principalAmount: row.principal_amount,
        isPaid: row.is_paid === 1,
        paidDate: row.paid_date ? new Date(row.paid_date) : undefined,
        daysOverdue: row.days_overdue
      });
    }

    return monthlyPayments;
  }

  // Sync status operations
  async updateSyncStatus(entityType: string, entityId: string, status: 'synced' | 'pending' | 'conflict', localData?: any, remoteData?: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT OR REPLACE INTO sync_status 
      (id, entity_type, entity_id, status, last_modified, local_data, remote_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const id = `${entityType}_${entityId}`;
    await this.db.executeSql(query, [
      id,
      entityType,
      entityId,
      status,
      new Date().toISOString(),
      localData ? JSON.stringify(localData) : null,
      remoteData ? JSON.stringify(remoteData) : null
    ]);
  }

  async getPendingSyncItems(): Promise<SyncStatus[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql(
      'SELECT * FROM sync_status WHERE status IN (?, ?) ORDER BY last_modified',
      ['pending', 'conflict']
    );
    const syncItems: SyncStatus[] = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      syncItems.push({
        id: row.id,
        entityType: row.entity_type,
        entityId: row.entity_id,
        status: row.status,
        lastModified: new Date(row.last_modified),
        localData: row.local_data ? JSON.parse(row.local_data) : undefined,
        remoteData: row.remote_data ? JSON.parse(row.remote_data) : undefined
      });
    }

    return syncItems;
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = ['users_local', 'clients_local', 'loans_local', 'payments_local', 'monthly_payments_local', 'sync_status'];
    
    for (const table of tables) {
      await this.db.executeSql(`DELETE FROM ${table}`);
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  // Get database instance for custom queries
  getDatabase(): SQLite.SQLiteDatabase | null {
    return this.db;
  }
}

export default new SQLiteService();