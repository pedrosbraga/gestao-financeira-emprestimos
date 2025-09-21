import SQLiteService from '../SQLiteService';
import SQLite from 'react-native-sqlite-storage';
import { User, Client, Loan, Payment, MonthlyPayment } from '../../../types';

// Mock SQLite
jest.mock('react-native-sqlite-storage');

const mockSQLite = SQLite as any;

describe('SQLiteService', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDb = {
      executeSql: jest.fn(),
      close: jest.fn()
    };

    mockSQLite.openDatabase.mockResolvedValue(mockDb);
  });

  describe('initialize', () => {
    it('should initialize database successfully', async () => {
      mockDb.executeSql.mockResolvedValue([]);

      await SQLiteService.initialize();

      expect(mockSQLite.openDatabase).toHaveBeenCalledWith({
        name: 'GestaoFinanceira.db',
        version: '1.0',
        displayName: 'Gestão Financeira Database',
        size: 200000
      });
      expect(mockDb.executeSql).toHaveBeenCalledTimes(15); // Number of CREATE TABLE and INDEX statements
    });

    it('should handle initialization error', async () => {
      const error = new Error('Database initialization failed');
      mockSQLite.openDatabase.mockRejectedValue(error);

      await expect(SQLiteService.initialize()).rejects.toThrow('Database initialization failed');
    });
  });

  describe('user operations', () => {
    beforeEach(async () => {
      mockDb.executeSql.mockResolvedValue([]);
      await SQLiteService.initialize();
    });

    it('should insert user successfully', async () => {
      const user: User = {
        id: '123',
        name: 'João Silva',
        email: 'joao@example.com',
        userType: 'CEO',
        permissions: [{ resource: 'loans', actions: ['read', 'write'] }],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        lastLogin: new Date('2023-01-01T00:00:00Z')
      };

      mockDb.executeSql.mockResolvedValue([]);

      await SQLiteService.insertUser(user);

      expect(mockDb.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO users_local'),
        [
          '123',
          'João Silva',
          'joao@example.com',
          'CEO',
          JSON.stringify([{ resource: 'loans', actions: ['read', 'write'] }]),
          '2023-01-01T00:00:00.000Z',
          '2023-01-01T00:00:00.000Z',
          expect.any(String), // last_modified timestamp
          'pending'
        ]
      );
    });

    it('should get users successfully', async () => {
      const mockRows = {
        length: 1,
        item: jest.fn().mockReturnValue({
          id: '123',
          name: 'João Silva',
          email: 'joao@example.com',
          user_type: 'CEO',
          permissions: JSON.stringify([{ resource: 'loans', actions: ['read', 'write'] }]),
          created_at: '2023-01-01T00:00:00.000Z',
          last_login: '2023-01-01T00:00:00.000Z'
        })
      };

      mockDb.executeSql.mockResolvedValue([{ rows: mockRows }]);

      const users = await SQLiteService.getUsers();

      expect(users).toHaveLength(1);
      expect(users[0]).toEqual({
        id: '123',
        name: 'João Silva',
        email: 'joao@example.com',
        userType: 'CEO',
        permissions: [{ resource: 'loans', actions: ['read', 'write'] }],
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        lastLogin: new Date('2023-01-01T00:00:00.000Z')
      });
    });

    it('should throw error when database not initialized', async () => {
      // Create a new instance without initialization
      const uninitializedService = Object.create(Object.getPrototypeOf(SQLiteService));
      
      await expect(uninitializedService.insertUser({} as User)).rejects.toThrow('Database not initialized');
    });
  });

  describe('client operations', () => {
    beforeEach(async () => {
      mockDb.executeSql.mockResolvedValue([]);
      await SQLiteService.initialize();
    });

    it('should insert client successfully', async () => {
      const client: Client = {
        id: '456',
        name: 'Maria Silva',
        document: '123.456.789-01',
        phone: '(11) 99999-9999',
        address: {
          street: 'Rua A',
          number: '123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567'
        },
        references: [
          { name: 'João', phone: '(11) 88888-8888', relationship: 'Amigo' }
        ],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        loans: []
      };

      mockDb.executeSql.mockResolvedValue([]);

      await SQLiteService.insertClient(client);

      expect(mockDb.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO clients_local'),
        [
          '456',
          'Maria Silva',
          '123.456.789-01',
          '(11) 99999-9999',
          JSON.stringify(client.address),
          JSON.stringify(client.references),
          '2023-01-01T00:00:00.000Z',
          expect.any(String), // last_modified timestamp
          'pending'
        ]
      );
    });

    it('should get clients successfully', async () => {
      const mockRows = {
        length: 1,
        item: jest.fn().mockReturnValue({
          id: '456',
          name: 'Maria Silva',
          document: '123.456.789-01',
          phone: '(11) 99999-9999',
          address: JSON.stringify({
            street: 'Rua A',
            number: '123',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01234-567'
          }),
          references: JSON.stringify([
            { name: 'João', phone: '(11) 88888-8888', relationship: 'Amigo' }
          ]),
          created_at: '2023-01-01T00:00:00.000Z'
        })
      };

      mockDb.executeSql.mockResolvedValue([{ rows: mockRows }]);

      const clients = await SQLiteService.getClients();

      expect(clients).toHaveLength(1);
      expect(clients[0]).toEqual({
        id: '456',
        name: 'Maria Silva',
        document: '123.456.789-01',
        phone: '(11) 99999-9999',
        address: {
          street: 'Rua A',
          number: '123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567'
        },
        references: [
          { name: 'João', phone: '(11) 88888-8888', relationship: 'Amigo' }
        ],
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        loans: []
      });
    });

    it('should get client by id successfully', async () => {
      const mockRows = {
        length: 1,
        item: jest.fn().mockReturnValue({
          id: '456',
          name: 'Maria Silva',
          document: '123.456.789-01',
          phone: '(11) 99999-9999',
          address: JSON.stringify({
            street: 'Rua A',
            number: '123',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01234-567'
          }),
          references: JSON.stringify([
            { name: 'João', phone: '(11) 88888-8888', relationship: 'Amigo' }
          ]),
          created_at: '2023-01-01T00:00:00.000Z'
        })
      };

      // Mock both client query and loans query
      mockDb.executeSql
        .mockResolvedValueOnce([{ rows: mockRows }]) // Client query
        .mockResolvedValueOnce([{ rows: { length: 0, item: jest.fn() } }]); // Loans query

      const client = await SQLiteService.getClientById('456');

      expect(client).not.toBeNull();
      expect(client?.id).toBe('456');
      expect(client?.name).toBe('Maria Silva');
      expect(client?.loans).toEqual([]);
    });

    it('should return null for non-existent client', async () => {
      mockDb.executeSql.mockResolvedValue([{ rows: { length: 0, item: jest.fn() } }]);

      const client = await SQLiteService.getClientById('999');

      expect(client).toBeNull();
    });
  });

  describe('loan operations', () => {
    beforeEach(async () => {
      mockDb.executeSql.mockResolvedValue([]);
      await SQLiteService.initialize();
    });

    it('should insert loan successfully', async () => {
      const loan: Loan = {
        id: '789',
        clientId: '456',
        amount: 10000,
        interestRate: 5.5,
        startDate: new Date('2023-01-01T00:00:00Z'),
        source: 'INVESTIMENTO',
        status: 'ATIVO',
        remainingBalance: 10000,
        payments: []
      };

      mockDb.executeSql.mockResolvedValue([]);

      await SQLiteService.insertLoan(loan);

      expect(mockDb.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO loans_local'),
        [
          '789',
          '456',
          10000,
          5.5,
          '2023-01-01T00:00:00.000Z',
          'INVESTIMENTO',
          'ATIVO',
          10000,
          expect.any(String), // created_at timestamp
          expect.any(String), // last_modified timestamp
          'pending'
        ]
      );
    });

    it('should get loans successfully', async () => {
      const mockRows = {
        length: 1,
        item: jest.fn().mockReturnValue({
          id: '789',
          client_id: '456',
          amount: 10000,
          interest_rate: 5.5,
          start_date: '2023-01-01T00:00:00.000Z',
          source: 'INVESTIMENTO',
          status: 'ATIVO',
          remaining_balance: 10000
        })
      };

      mockDb.executeSql.mockResolvedValue([{ rows: mockRows }]);

      const loans = await SQLiteService.getLoans();

      expect(loans).toHaveLength(1);
      expect(loans[0]).toEqual({
        id: '789',
        clientId: '456',
        amount: 10000,
        interestRate: 5.5,
        startDate: new Date('2023-01-01T00:00:00.000Z'),
        source: 'INVESTIMENTO',
        status: 'ATIVO',
        remainingBalance: 10000,
        payments: []
      });
    });
  });

  describe('payment operations', () => {
    beforeEach(async () => {
      mockDb.executeSql.mockResolvedValue([]);
      await SQLiteService.initialize();
    });

    it('should insert payment successfully', async () => {
      const payment: Payment = {
        id: '101',
        loanId: '789',
        date: new Date('2023-02-01T00:00:00Z'),
        interestAmount: 500,
        principalAmount: 1000,
        totalAmount: 1500,
        paymentType: 'JUROS_PRINCIPAL'
      };

      mockDb.executeSql.mockResolvedValue([]);

      await SQLiteService.insertPayment(payment);

      expect(mockDb.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO payments_local'),
        [
          '101',
          '789',
          '2023-02-01T00:00:00.000Z',
          500,
          1000,
          1500,
          'JUROS_PRINCIPAL',
          expect.any(String), // created_at timestamp
          expect.any(String), // last_modified timestamp
          'pending'
        ]
      );
    });

    it('should get payments by loan id successfully', async () => {
      const mockRows = {
        length: 1,
        item: jest.fn().mockReturnValue({
          id: '101',
          loan_id: '789',
          payment_date: '2023-02-01T00:00:00.000Z',
          interest_amount: 500,
          principal_amount: 1000,
          total_amount: 1500,
          payment_type: 'JUROS_PRINCIPAL'
        })
      };

      mockDb.executeSql.mockResolvedValue([{ rows: mockRows }]);

      const payments = await SQLiteService.getPaymentsByLoanId('789');

      expect(payments).toHaveLength(1);
      expect(payments[0]).toEqual({
        id: '101',
        loanId: '789',
        date: new Date('2023-02-01T00:00:00.000Z'),
        interestAmount: 500,
        principalAmount: 1000,
        totalAmount: 1500,
        paymentType: 'JUROS_PRINCIPAL'
      });
    });
  });

  describe('monthly payment operations', () => {
    beforeEach(async () => {
      mockDb.executeSql.mockResolvedValue([]);
      await SQLiteService.initialize();
    });

    it('should insert monthly payment successfully', async () => {
      const monthlyPayment: MonthlyPayment = {
        id: '202',
        loanId: '789',
        clientName: 'Maria Silva',
        dueDate: new Date('2023-03-15T00:00:00Z'),
        interestAmount: 500,
        principalAmount: 0,
        isPaid: false,
        daysOverdue: 0
      };

      mockDb.executeSql.mockResolvedValue([]);

      await SQLiteService.insertMonthlyPayment(monthlyPayment);

      expect(mockDb.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO monthly_payments_local'),
        [
          '202',
          '789',
          'Maria Silva',
          '2023-03-15T00:00:00.000Z',
          500,
          0,
          0, // isPaid as integer
          null, // paidDate
          0,
          expect.any(String), // created_at timestamp
          expect.any(String), // last_modified timestamp
          'pending'
        ]
      );
    });

    it('should get monthly payments for specific month/year', async () => {
      const mockRows = {
        length: 1,
        item: jest.fn().mockReturnValue({
          id: '202',
          loan_id: '789',
          client_name: 'Maria Silva',
          due_date: '2023-03-15T00:00:00.000Z',
          interest_amount: 500,
          principal_amount: 0,
          is_paid: 0,
          paid_date: null,
          days_overdue: 0
        })
      };

      mockDb.executeSql.mockResolvedValue([{ rows: mockRows }]);

      const monthlyPayments = await SQLiteService.getMonthlyPayments(3, 2023);

      expect(monthlyPayments).toHaveLength(1);
      expect(monthlyPayments[0]).toEqual({
        id: '202',
        loanId: '789',
        clientName: 'Maria Silva',
        dueDate: new Date('2023-03-15T00:00:00.000Z'),
        interestAmount: 500,
        principalAmount: 0,
        isPaid: false,
        paidDate: undefined,
        daysOverdue: 0
      });

      // Verify the date range query
      expect(mockDb.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('WHERE due_date >= ? AND due_date <= ?'),
        [
          '2023-03-01T00:00:00.000Z', // Start of March 2023
          '2023-03-31T23:59:59.000Z'  // End of March 2023
        ]
      );
    });
  });

  describe('sync status operations', () => {
    beforeEach(async () => {
      mockDb.executeSql.mockResolvedValue([]);
      await SQLiteService.initialize();
    });

    it('should update sync status successfully', async () => {
      const localData = { id: '123', name: 'Test' };
      const remoteData = { id: '123', name: 'Test Remote' };

      mockDb.executeSql.mockResolvedValue([]);

      await SQLiteService.updateSyncStatus('user', '123', 'conflict', localData, remoteData);

      expect(mockDb.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO sync_status'),
        [
          'user_123',
          'user',
          '123',
          'conflict',
          expect.any(String), // last_modified timestamp
          JSON.stringify(localData),
          JSON.stringify(remoteData)
        ]
      );
    });

    it('should get pending sync items successfully', async () => {
      const mockRows = {
        length: 1,
        item: jest.fn().mockReturnValue({
          id: 'user_123',
          entity_type: 'user',
          entity_id: '123',
          status: 'pending',
          last_modified: '2023-01-01T00:00:00.000Z',
          local_data: JSON.stringify({ id: '123', name: 'Test' }),
          remote_data: null
        })
      };

      mockDb.executeSql.mockResolvedValue([{ rows: mockRows }]);

      const syncItems = await SQLiteService.getPendingSyncItems();

      expect(syncItems).toHaveLength(1);
      expect(syncItems[0]).toEqual({
        id: 'user_123',
        entityType: 'user',
        entityId: '123',
        status: 'pending',
        lastModified: new Date('2023-01-01T00:00:00.000Z'),
        localData: { id: '123', name: 'Test' },
        remoteData: undefined
      });
    });
  });

  describe('utility methods', () => {
    beforeEach(async () => {
      mockDb.executeSql.mockResolvedValue([]);
      await SQLiteService.initialize();
    });

    it('should clear all data successfully', async () => {
      mockDb.executeSql.mockResolvedValue([]);

      await SQLiteService.clearAllData();

      expect(mockDb.executeSql).toHaveBeenCalledTimes(6); // 5 tables + initial setup calls
      expect(mockDb.executeSql).toHaveBeenCalledWith('DELETE FROM users_local');
      expect(mockDb.executeSql).toHaveBeenCalledWith('DELETE FROM clients_local');
      expect(mockDb.executeSql).toHaveBeenCalledWith('DELETE FROM loans_local');
      expect(mockDb.executeSql).toHaveBeenCalledWith('DELETE FROM payments_local');
      expect(mockDb.executeSql).toHaveBeenCalledWith('DELETE FROM monthly_payments_local');
      expect(mockDb.executeSql).toHaveBeenCalledWith('DELETE FROM sync_status');
    });

    it('should close database successfully', async () => {
      mockDb.close.mockResolvedValue(undefined);

      await SQLiteService.close();

      expect(mockDb.close).toHaveBeenCalled();
    });

    it('should return database instance', () => {
      const db = SQLiteService.getDatabase();
      expect(db).toBe(mockDb);
    });
  });
});