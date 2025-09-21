import {
  validateLoan,
  validateNewLoanForm,
  validateUpdateLoanForm,
  validateLoanAmount,
  validateInterestRate,
  canCreateLoan,
  validateLoanFilters
} from '../loanValidators';

describe('Loan Validators', () => {
  describe('validateLoan', () => {
    it('should validate a valid loan object', () => {
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

    it('should throw error for negative remaining balance', () => {
      const invalidLoan = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        clientId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 10000,
        interestRate: 5.5,
        startDate: new Date(),
        source: 'INVESTIMENTO',
        status: 'ATIVO',
        payments: [],
        remainingBalance: -1000
      };

      expect(() => validateLoan(invalidLoan)).toThrow();
    });

    it('should throw error for invalid source', () => {
      const invalidLoan = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        clientId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 10000,
        interestRate: 5.5,
        startDate: new Date(),
        source: 'INVALID',
        status: 'ATIVO',
        payments: [],
        remainingBalance: 10000
      };

      expect(() => validateLoan(invalidLoan)).toThrow();
    });
  });

  describe('validateNewLoanForm', () => {
    it('should validate a valid new loan form', () => {
      const validNewLoanForm = {
        clientId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 10000,
        interestRate: 5.5,
        startDate: new Date(),
        source: 'INVESTIMENTO'
      };

      expect(() => validateNewLoanForm(validNewLoanForm)).not.toThrow();
    });

    it('should throw error for amount below minimum', () => {
      const invalidNewLoanForm = {
        clientId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 50, // Below minimum of 100
        interestRate: 5.5,
        startDate: new Date(),
        source: 'INVESTIMENTO'
      };

      expect(() => validateNewLoanForm(invalidNewLoanForm)).toThrow();
    });

    it('should throw error for interest rate below minimum', () => {
      const invalidNewLoanForm = {
        clientId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 10000,
        interestRate: 0.05, // Below minimum of 0.1%
        startDate: new Date(),
        source: 'INVESTIMENTO'
      };

      expect(() => validateNewLoanForm(invalidNewLoanForm)).toThrow();
    });

    it('should throw error for interest rate above maximum', () => {
      const invalidNewLoanForm = {
        clientId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 10000,
        interestRate: 55, // Above maximum of 50%
        startDate: new Date(),
        source: 'INVESTIMENTO'
      };

      expect(() => validateNewLoanForm(invalidNewLoanForm)).toThrow();
    });

    it('should throw error for future start date beyond today', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const invalidNewLoanForm = {
        clientId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 10000,
        interestRate: 5.5,
        startDate: futureDate,
        source: 'INVESTIMENTO'
      };

      expect(() => validateNewLoanForm(invalidNewLoanForm)).toThrow();
    });

    it('should throw error for start date too far in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 31); // 31 days ago

      const invalidNewLoanForm = {
        clientId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 10000,
        interestRate: 5.5,
        startDate: pastDate,
        source: 'INVESTIMENTO'
      };

      expect(() => validateNewLoanForm(invalidNewLoanForm)).toThrow();
    });
  });

  describe('validateLoanAmount', () => {
    it('should validate amount within limits', () => {
      expect(validateLoanAmount(50000)).toBe(true);
    });

    it('should reject amount above maximum', () => {
      expect(validateLoanAmount(150000)).toBe(false);
    });

    it('should validate amount based on client history', () => {
      const clientHistory = {
        totalBorrowed: 50000,
        totalPaid: 30000
      };

      expect(validateLoanAmount(50000, clientHistory)).toBe(true);
      expect(validateLoanAmount(70000, clientHistory)).toBe(false); // Above 2x totalPaid
    });

    it('should use minimum limit for new clients', () => {
      const newClientHistory = {
        totalBorrowed: 0,
        totalPaid: 0
      };

      expect(validateLoanAmount(10000, newClientHistory)).toBe(true);
      expect(validateLoanAmount(15000, newClientHistory)).toBe(false); // Above minimum 10k for new clients
    });
  });

  describe('validateInterestRate', () => {
    it('should validate normal interest rates', () => {
      expect(validateInterestRate(5.5, 10000)).toBe(true);
    });

    it('should enforce lower rates for high amounts', () => {
      expect(validateInterestRate(8, 60000)).toBe(true); // 8% for 60k is ok
      expect(validateInterestRate(12, 60000)).toBe(false); // 12% for 60k is too high
    });

    it('should enforce rate limits for medium amounts', () => {
      expect(validateInterestRate(12, 30000)).toBe(true); // 12% for 30k is ok
      expect(validateInterestRate(18, 30000)).toBe(false); // 18% for 30k is too high
    });

    it('should reject rates outside valid range', () => {
      expect(validateInterestRate(0.05, 10000)).toBe(false); // Too low
      expect(validateInterestRate(55, 10000)).toBe(false); // Too high
    });
  });

  describe('canCreateLoan', () => {
    it('should allow loan creation for client with no active loans', () => {
      const result = canCreateLoan('client-1', []);
      expect(result.canCreate).toBe(true);
    });

    it('should allow loan creation for client with few active loans', () => {
      const activeLoans = [
        { clientId: 'client-1', status: 'ATIVO', remainingBalance: 10000 },
        { clientId: 'client-2', status: 'ATIVO', remainingBalance: 15000 }
      ];

      const result = canCreateLoan('client-1', activeLoans);
      expect(result.canCreate).toBe(true);
    });

    it('should reject loan creation for client with too many active loans', () => {
      const activeLoans = [
        { clientId: 'client-1', status: 'ATIVO', remainingBalance: 10000 },
        { clientId: 'client-1', status: 'ATIVO', remainingBalance: 15000 },
        { clientId: 'client-1', status: 'ATIVO', remainingBalance: 20000 }
      ];

      const result = canCreateLoan('client-1', activeLoans);
      expect(result.canCreate).toBe(false);
      expect(result.reason).toContain('3 empréstimos ativos');
    });

    it('should reject loan creation for client with high total active amount', () => {
      const activeLoans = [
        { clientId: 'client-1', status: 'ATIVO', remainingBalance: 100000 },
        { clientId: 'client-1', status: 'ATIVO', remainingBalance: 150000 }
      ];

      const result = canCreateLoan('client-1', activeLoans);
      expect(result.canCreate).toBe(false);
      expect(result.reason).toContain('R$ 200.000');
    });
  });

  describe('validateLoanFilters', () => {
    it('should validate valid filters', () => {
      const validFilters = {
        status: 'ATIVO',
        source: 'INVESTIMENTO',
        minAmount: 1000,
        maxAmount: 50000,
        startDateAfter: new Date('2023-01-01'),
        startDateBefore: new Date('2023-12-31'),
        clientId: '123e4567-e89b-12d3-a456-426614174001'
      };

      expect(() => validateLoanFilters(validFilters)).not.toThrow();
    });

    it('should throw error when minAmount > maxAmount', () => {
      const invalidFilters = {
        minAmount: 50000,
        maxAmount: 10000
      };

      expect(() => validateLoanFilters(invalidFilters)).toThrow();
    });

    it('should throw error when startDateAfter > startDateBefore', () => {
      const invalidFilters = {
        startDateAfter: new Date('2023-12-31'),
        startDateBefore: new Date('2023-01-01')
      };

      expect(() => validateLoanFilters(invalidFilters)).toThrow();
    });
  });
});