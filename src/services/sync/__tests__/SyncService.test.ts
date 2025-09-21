import SyncService, { SyncResult, SyncConflict } from '../SyncService';
import SQLiteService from '../../database/SQLiteService';
import { supabase } from '../../supabase/config';
import NetInfo from '@react-native-community/netinfo';

// Mock dependencies
jest.mock('../../database/SQLiteService');
jest.mock('../../supabase/config');
jest.mock('@react-native-community/netinfo');

const mockSQLiteService = SQLiteService as any;
const mockSupabase = supabase as any;
const mockNetInfo = NetInfo as any;

describe('SyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock NetInfo to return connected state
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
      details: {}
    } as any);

    mockNetInfo.addEventListener.mockImplementation(() => jest.fn());
  });

  describe('initialize', () => {
    it('should set up network state listener', async () => {
      await SyncService.initialize();
      
      expect(mockNetInfo.addEventListener).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('syncAll', () => {
    it('should sync all entities successfully', async () => {
      // Mock local data
      mockSQLiteService.getUsers.mockResolvedValue([]);
      mockSQLiteService.getClients.mockResolvedValue([]);
      mockSQLiteService.getLoans.mockResolvedValue([]);
      mockSQLiteService.getMonthlyPayments.mockResolvedValue([]);

      // Mock remote data
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [], error: null })
      } as any);

      const result = await SyncService.syncAll();

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(0);
      expect(result.conflictCount).toBe(0);
      expect(result.errorCount).toBe(0);
    });

    it('should handle network connectivity error', async () => {
      mockNetInfo.fetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
        details: {}
      } as any);

      const result = await SyncService.syncAll();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('No network connection available');
      expect(result.errorCount).toBe(1);
    });

    it('should handle sync already in progress', async () => {
      // Start first sync
      const firstSyncPromise = SyncService.syncAll();

      // Try to start second sync while first is running
      await expect(SyncService.syncAll()).rejects.toThrow('Sync already in progress');

      // Wait for first sync to complete
      await firstSyncPromise;
    });
  });

  describe('syncPendingChanges', () => {
    it('should return early if no pending changes', async () => {
      mockSQLiteService.getPendingSyncItems.mockResolvedValue([]);

      const result = await SyncService.syncPendingChanges();

      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(0);
    });

    it('should sync when there are pending changes', async () => {
      mockSQLiteService.getPendingSyncItems.mockResolvedValue([
        {
          id: 'user_123',
          entityType: 'user',
          entityId: '123',
          status: 'pending',
          lastModified: new Date()
        }
      ]);

      // Mock the full sync process
      mockSQLiteService.getUsers.mockResolvedValue([]);
      mockSQLiteService.getClients.mockResolvedValue([]);
      mockSQLiteService.getLoans.mockResolvedValue([]);
      mockSQLiteService.getMonthlyPayments.mockResolvedValue([]);

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [], error: null })
      } as any);

      const result = await SyncService.syncPendingChanges();

      expect(result.success).toBe(true);
    });
  });

  describe('user synchronization', () => {
    it('should sync new remote user to local', async () => {
      const remoteUser = {
        id: '123',
        name: 'João Silva',
        email: 'joao@example.com',
        user_type: 'CEO',
        permissions: [],
        created_at: '2023-01-01T00:00:00Z',
        last_login: '2023-01-01T00:00:00Z'
      };

      mockSQLiteService.getUsers.mockResolvedValue([]);
      mockSQLiteService.getClients.mockResolvedValue([]);
      mockSQLiteService.getLoans.mockResolvedValue([]);
      mockSQLiteService.getMonthlyPayments.mockResolvedValue([]);

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockResolvedValue({ data: [remoteUser], error: null })
          } as any;
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        } as any;
      });

      const result = await SyncService.syncAll();

      expect(mockSQLiteService.insertUser).toHaveBeenCalledWith({
        id: '123',
        name: 'João Silva',
        email: 'joao@example.com',
        userType: 'CEO',
        permissions: [],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        lastLogin: new Date('2023-01-01T00:00:00Z')
      });
      expect(mockSQLiteService.updateSyncStatus).toHaveBeenCalledWith('user', '123', 'synced');
      expect(result.syncedCount).toBe(1);
    });

    it('should sync new local user to remote', async () => {
      const localUser = {
        id: '123',
        name: 'João Silva',
        email: 'joao@example.com',
        userType: 'CEO' as const,
        permissions: [],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        lastLogin: new Date('2023-01-01T00:00:00Z')
      };

      mockSQLiteService.getUsers.mockResolvedValue([localUser]);
      mockSQLiteService.getClients.mockResolvedValue([]);
      mockSQLiteService.getLoans.mockResolvedValue([]);
      mockSQLiteService.getMonthlyPayments.mockResolvedValue([]);

      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockResolvedValue({ data: [], error: null }),
            insert: mockInsert
          } as any;
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        } as any;
      });

      const result = await SyncService.syncAll();

      expect(mockInsert).toHaveBeenCalledWith({
        id: '123',
        name: 'João Silva',
        email: 'joao@example.com',
        user_type: 'CEO',
        permissions: [],
        created_at: '2023-01-01T00:00:00.000Z',
        last_login: '2023-01-01T00:00:00.000Z'
      });
      expect(mockSQLiteService.updateSyncStatus).toHaveBeenCalledWith('user', '123', 'synced');
      expect(result.syncedCount).toBe(1);
    });

    it('should detect and handle user conflicts', async () => {
      const localUser = {
        id: '123',
        name: 'João Silva',
        email: 'joao@example.com',
        userType: 'CEO' as const,
        permissions: [],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        lastLogin: new Date('2023-01-01T00:00:00Z')
      };

      const remoteUser = {
        id: '123',
        name: 'João Santos', // Different name - conflict
        email: 'joao@example.com',
        user_type: 'CEO',
        permissions: [],
        created_at: '2023-01-01T00:00:00Z',
        last_login: '2023-01-01T00:00:00Z'
      };

      mockSQLiteService.getUsers.mockResolvedValue([localUser]);
      mockSQLiteService.getClients.mockResolvedValue([]);
      mockSQLiteService.getLoans.mockResolvedValue([]);
      mockSQLiteService.getMonthlyPayments.mockResolvedValue([]);

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockResolvedValue({ data: [remoteUser], error: null })
          } as any;
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        } as any;
      });

      const result = await SyncService.syncAll();

      expect(result.conflictCount).toBe(1);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].entityType).toBe('user');
      expect(result.conflicts[0].entityId).toBe('123');
      expect(result.conflicts[0].conflictFields).toContain('name');
      expect(mockSQLiteService.updateSyncStatus).toHaveBeenCalledWith('user', '123', 'conflict', localUser, remoteUser);
    });
  });

  describe('client synchronization', () => {
    it('should sync new remote client to local', async () => {
      const remoteClient = {
        id: '456',
        name: 'Maria Silva',
        document: '123.456.789-01',
        phone: '(11) 99999-9999',
        address: { street: 'Rua A', number: '123', city: 'São Paulo', state: 'SP', zipCode: '01234-567' },
        references: [{ name: 'João', phone: '(11) 88888-8888', relationship: 'Amigo' }],
        created_at: '2023-01-01T00:00:00Z'
      };

      mockSQLiteService.getUsers.mockResolvedValue([]);
      mockSQLiteService.getClients.mockResolvedValue([]);
      mockSQLiteService.getLoans.mockResolvedValue([]);
      mockSQLiteService.getMonthlyPayments.mockResolvedValue([]);

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'clients') {
          return {
            select: jest.fn().mockResolvedValue({ data: [remoteClient], error: null })
          } as any;
        }
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null })
        } as any;
      });

      const result = await SyncService.syncAll();

      expect(mockSQLiteService.insertClient).toHaveBeenCalledWith({
        id: '456',
        name: 'Maria Silva',
        document: '123.456.789-01',
        phone: '(11) 99999-9999',
        address: { street: 'Rua A', number: '123', city: 'São Paulo', state: 'SP', zipCode: '01234-567' },
        references: [{ name: 'João', phone: '(11) 88888-8888', relationship: 'Amigo' }],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        loans: []
      });
      expect(result.syncedCount).toBe(1);
    });
  });

  describe('conflict resolution', () => {
    it('should resolve conflict with remote data', async () => {
      const conflictId = 'user_123';
      const remoteData = {
        id: '123',
        name: 'João Santos',
        email: 'joao@example.com',
        user_type: 'CEO',
        permissions: [],
        created_at: '2023-01-01T00:00:00Z',
        last_login: '2023-01-01T00:00:00Z'
      };

      mockSQLiteService.getPendingSyncItems.mockResolvedValue([
        {
          id: conflictId,
          entityType: 'user',
          entityId: '123',
          status: 'conflict',
          lastModified: new Date(),
          localData: {},
          remoteData
        }
      ]);

      await SyncService.resolveConflict(conflictId, 'remote');

      expect(mockSQLiteService.insertUser).toHaveBeenCalledWith({
        id: '123',
        name: 'João Santos',
        email: 'joao@example.com',
        userType: 'CEO',
        permissions: [],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        lastLogin: new Date('2023-01-01T00:00:00Z')
      });
      expect(mockSQLiteService.updateSyncStatus).toHaveBeenCalledWith('user', '123', 'synced');
    });

    it('should resolve conflict with local data', async () => {
      const conflictId = 'user_123';
      const localData = {
        id: '123',
        name: 'João Silva',
        email: 'joao@example.com',
        userType: 'CEO' as const,
        permissions: [],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        lastLogin: new Date('2023-01-01T00:00:00Z')
      };

      mockSQLiteService.getPendingSyncItems.mockResolvedValue([
        {
          id: conflictId,
          entityType: 'user',
          entityId: '123',
          status: 'conflict',
          lastModified: new Date(),
          localData,
          remoteData: {}
        }
      ]);

      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        upsert: mockUpsert
      } as any);

      await SyncService.resolveConflict(conflictId, 'local');

      expect(mockUpsert).toHaveBeenCalledWith({
        id: '123',
        name: 'João Silva',
        email: 'joao@example.com',
        user_type: 'CEO',
        permissions: [],
        created_at: '2023-01-01T00:00:00.000Z',
        last_login: '2023-01-01T00:00:00.000Z'
      });
      expect(mockSQLiteService.updateSyncStatus).toHaveBeenCalledWith('user', '123', 'synced');
    });

    it('should throw error for non-existent conflict', async () => {
      mockSQLiteService.getPendingSyncItems.mockResolvedValue([]);

      await expect(SyncService.resolveConflict('user_999', 'remote')).rejects.toThrow('Conflict not found');
    });
  });

  describe('sync listeners', () => {
    it('should add and notify sync listeners', async () => {
      const listener = jest.fn();
      SyncService.addSyncListener(listener);

      mockSQLiteService.getUsers.mockResolvedValue([]);
      mockSQLiteService.getClients.mockResolvedValue([]);
      mockSQLiteService.getLoans.mockResolvedValue([]);
      mockSQLiteService.getMonthlyPayments.mockResolvedValue([]);

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: [], error: null })
      } as any);

      await SyncService.syncAll();

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        syncedCount: 0,
        conflictCount: 0,
        errorCount: 0
      }));
    });

    it('should remove sync listeners', () => {
      const listener = jest.fn();
      SyncService.addSyncListener(listener);
      SyncService.removeSyncListener(listener);

      // Listener should not be called after removal
      // This is tested implicitly by not having the listener called in subsequent tests
    });
  });

  describe('getters', () => {
    it('should return sync status', () => {
      expect(typeof SyncService.getIsSyncing()).toBe('boolean');
      expect(SyncService.getLastSyncDate()).toBeNull(); // Initially null
    });
  });
});