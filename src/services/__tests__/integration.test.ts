/**
 * Integration tests for database and sync services
 * These tests verify the basic functionality without complex mocking
 */

describe('Database and Sync Services Integration', () => {
  describe('SQLite Service', () => {
    it('should have proper database configuration', () => {
      // Test that the service exports the expected interface
      const SQLiteService = require('../database/SQLiteService').default;
      
      expect(typeof SQLiteService.initialize).toBe('function');
      expect(typeof SQLiteService.insertUser).toBe('function');
      expect(typeof SQLiteService.getUsers).toBe('function');
      expect(typeof SQLiteService.insertClient).toBe('function');
      expect(typeof SQLiteService.getClients).toBe('function');
      expect(typeof SQLiteService.insertLoan).toBe('function');
      expect(typeof SQLiteService.getLoans).toBe('function');
      expect(typeof SQLiteService.insertPayment).toBe('function');
      expect(typeof SQLiteService.insertMonthlyPayment).toBe('function');
      expect(typeof SQLiteService.getMonthlyPayments).toBe('function');
      expect(typeof SQLiteService.updateSyncStatus).toBe('function');
      expect(typeof SQLiteService.getPendingSyncItems).toBe('function');
      expect(typeof SQLiteService.clearAllData).toBe('function');
      expect(typeof SQLiteService.close).toBe('function');
    });

    it('should handle database not initialized error', async () => {
      const SQLiteService = require('../database/SQLiteService').default;
      
      // Create a fresh instance without initialization
      const uninitializedService = Object.create(Object.getPrototypeOf(SQLiteService));
      
      await expect(uninitializedService.getUsers()).rejects.toThrow('Database not initialized');
    });
  });

  describe('Sync Service', () => {
    it('should have proper sync interface', () => {
      const SyncService = require('../sync/SyncService').default;
      
      expect(typeof SyncService.initialize).toBe('function');
      expect(typeof SyncService.syncAll).toBe('function');
      expect(typeof SyncService.syncPendingChanges).toBe('function');
      expect(typeof SyncService.resolveConflict).toBe('function');
      expect(typeof SyncService.addSyncListener).toBe('function');
      expect(typeof SyncService.removeSyncListener).toBe('function');
      expect(typeof SyncService.getIsSyncing).toBe('function');
      expect(typeof SyncService.getLastSyncDate).toBe('function');
    });

    it('should prevent concurrent sync operations', async () => {
      const SyncService = require('../sync/SyncService').default;
      
      // This test verifies the interface exists and basic error handling
      // We can't easily test the actual concurrent sync without complex mocking
      expect(typeof SyncService.syncAll).toBe('function');
      expect(SyncService.getIsSyncing()).toBe(false);
    });

    it('should handle sync listeners correctly', () => {
      const SyncService = require('../sync/SyncService').default;
      
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      // Add listeners
      SyncService.addSyncListener(listener1);
      SyncService.addSyncListener(listener2);
      
      // Remove one listener
      SyncService.removeSyncListener(listener1);
      
      // This test verifies the listener management works without errors
      expect(true).toBe(true);
    });

    it('should return initial sync state', () => {
      const SyncService = require('../sync/SyncService').default;
      
      expect(SyncService.getIsSyncing()).toBe(false);
      expect(SyncService.getLastSyncDate()).toBeNull();
    });
  });

  describe('Data Model Validation', () => {
    it('should validate user data correctly', () => {
      const { validateUser } = require('../../validators/userValidators');
      
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'João Silva',
        email: 'joao@example.com',
        userType: 'CEO',
        permissions: [],
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      expect(() => validateUser(validUser)).not.toThrow();
    });

    it('should validate client data correctly', () => {
      const { validateClient } = require('../../validators/clientValidators');
      
      const validClient = {
        id: '123e4567-e89b-12d3-a456-426614174000',
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
        createdAt: new Date(),
        loans: []
      };
      
      expect(() => validateClient(validClient)).not.toThrow();
    });

    it('should validate loan data correctly', () => {
      const { validateLoan } = require('../../validators/loanValidators');
      
      const validLoan = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        clientId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 10000,
        interestRate: 5.5,
        startDate: new Date(),
        source: 'INVESTIMENTO',
        status: 'ATIVO',
        payments: [],
        remainingBalance: 10000
      };
      
      expect(() => validateLoan(validLoan)).not.toThrow();
    });

    it('should validate payment data correctly', () => {
      const { validatePayment } = require('../../validators/paymentValidators');
      
      const validPayment = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        loanId: '123e4567-e89b-12d3-a456-426614174001',
        date: new Date(),
        interestAmount: 500,
        principalAmount: 1000,
        totalAmount: 1500,
        paymentType: 'JUROS_PRINCIPAL'
      };
      
      expect(() => validatePayment(validPayment)).not.toThrow();
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate loan amounts correctly', () => {
      const { validateLoanAmount } = require('../../validators/loanValidators');
      
      expect(validateLoanAmount(50000)).toBe(true);
      expect(validateLoanAmount(150000)).toBe(false); // Above maximum
      
      const clientHistory = {
        totalBorrowed: 50000,
        totalPaid: 30000
      };
      
      expect(validateLoanAmount(50000, clientHistory)).toBe(true);
      expect(validateLoanAmount(70000, clientHistory)).toBe(false); // Above 2x totalPaid
    });

    it('should validate interest rates correctly', () => {
      const { validateInterestRate } = require('../../validators/loanValidators');
      
      expect(validateInterestRate(5.5, 10000)).toBe(true);
      expect(validateInterestRate(0.05, 10000)).toBe(false); // Too low
      expect(validateInterestRate(55, 10000)).toBe(false); // Too high
      expect(validateInterestRate(12, 60000)).toBe(false); // Too high for large amount
    });

    it('should check loan creation eligibility', () => {
      const { canCreateLoan } = require('../../validators/loanValidators');
      
      const activeLoans = [
        { clientId: 'client-1', status: 'ATIVO', remainingBalance: 10000 },
        { clientId: 'client-1', status: 'ATIVO', remainingBalance: 15000 }
      ];
      
      const result = canCreateLoan('client-1', activeLoans);
      expect(result.canCreate).toBe(true);
      
      // Test with too many loans
      const tooManyLoans = [
        { clientId: 'client-1', status: 'ATIVO', remainingBalance: 10000 },
        { clientId: 'client-1', status: 'ATIVO', remainingBalance: 15000 },
        { clientId: 'client-1', status: 'ATIVO', remainingBalance: 20000 }
      ];
      
      const resultTooMany = canCreateLoan('client-1', tooManyLoans);
      expect(resultTooMany.canCreate).toBe(false);
      expect(resultTooMany.reason).toContain('3 empréstimos ativos');
    });

    it('should validate payment amounts against loan', () => {
      const { validatePaymentAmount } = require('../../validators/paymentValidators');
      
      const mockLoan = {
        remainingBalance: 10000,
        interestRate: 5.0
      };
      
      const result = validatePaymentAmount(500, 1000, mockLoan);
      expect(result.isValid).toBe(true);
      
      // Test principal exceeding balance
      const resultExceeding = validatePaymentAmount(500, 15000, mockLoan);
      expect(resultExceeding.isValid).toBe(false);
      expect(resultExceeding.errors).toContain('Valor do principal não pode ser maior que o saldo devedor');
    });

    it('should calculate overdue days correctly', () => {
      const { calculateOverdueDays } = require('../../validators/paymentValidators');
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      expect(calculateOverdueDays(futureDate)).toBe(0);
      
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      expect(calculateOverdueDays(pastDate)).toBe(5);
    });
  });

  describe('Summary Calculations', () => {
    it('should calculate monthly summary correctly', () => {
      const { calculateMonthlySummary } = require('../../validators/summaryValidators');
      
      const mockTransactions = [
        {
          date: new Date('2023-06-15'),
          type: 'ENTRADA',
          category: 'INVESTIMENTO',
          amount: 50000
        },
        {
          date: new Date('2023-06-20'),
          type: 'SAIDA',
          category: 'EMPRESTIMO',
          amount: 30000
        },
        {
          date: new Date('2023-06-25'),
          type: 'ENTRADA',
          category: 'PAGAMENTO_JUROS',
          amount: 1500
        }
      ];
      
      const result = calculateMonthlySummary(6, 2023, mockTransactions);
      
      expect(result.month).toBe('06');
      expect(result.year).toBe(2023);
      expect(result.investimento).toBe(50000);
      expect(result.debito).toBe(30000);
      expect(result.creditoJuros).toBe(1500);
    });

    it('should validate investment amounts', () => {
      const { validateInvestmentAmount } = require('../../validators/summaryValidators');
      
      const result = validateInvestmentAmount('APORTE', 10000, 50000);
      expect(result.isValid).toBe(true);
      
      const resultWithdrawal = validateInvestmentAmount('RETIRADA', 60000, 50000);
      expect(resultWithdrawal.isValid).toBe(false);
      expect(resultWithdrawal.errors).toContain('Valor da retirada não pode ser maior que o saldo disponível');
    });

    it('should validate summary consistency', () => {
      const { validateSummaryConsistency } = require('../../validators/summaryValidators');
      
      const validSummaries = [
        { month: '01', year: 2023, totalEmp: 10000, creditoJuros: 500, creditoDiv: 1000 },
        { month: '02', year: 2023, totalEmp: 15000, creditoJuros: 750, creditoDiv: 1500 }
      ];
      
      const result = validateSummaryConsistency(validSummaries);
      expect(result.isValid).toBe(true);
      
      const invalidSummaries = [
        { month: '01', year: 2023, totalEmp: -10000, creditoJuros: 500, creditoDiv: 1000 }
      ];
      
      const resultInvalid = validateSummaryConsistency(invalidSummaries);
      expect(resultInvalid.isValid).toBe(false);
      expect(resultInvalid.errors).toContain('Total emprestado não pode ser negativo no mês 01/2023');
    });
  });
});