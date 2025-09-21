import {
  validatePayment,
  validateMonthlyPayment,
  validateNewPaymentForm,
  validatePaymentAmount,
  canRegisterPayment,
  calculateOverdueDays,
  validateMonthlyPaymentRegistration
} from '../paymentValidators';

describe('Payment Validators', () => {
  describe('validatePayment', () => {
    it('should validate a valid payment object', () => {
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

    it('should throw error when total amount does not match sum', () => {
      const invalidPayment = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        loanId: '123e4567-e89b-12d3-a456-426614174001',
        date: new Date(),
        interestAmount: 500,
        principalAmount: 1000,
        totalAmount: 2000, // Should be 1500
        paymentType: 'JUROS_PRINCIPAL'
      };

      expect(() => validatePayment(invalidPayment)).toThrow();
    });

    it('should throw error for negative interest amount', () => {
      const invalidPayment = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        loanId: '123e4567-e89b-12d3-a456-426614174001',
        date: new Date(),
        interestAmount: -500,
        principalAmount: 1000,
        totalAmount: 500,
        paymentType: 'JUROS_PRINCIPAL'
      };

      expect(() => validatePayment(invalidPayment)).toThrow();
    });

    it('should throw error for negative principal amount', () => {
      const invalidPayment = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        loanId: '123e4567-e89b-12d3-a456-426614174001',
        date: new Date(),
        interestAmount: 500,
        principalAmount: -1000,
        totalAmount: -500,
        paymentType: 'JUROS_PRINCIPAL'
      };

      expect(() => validatePayment(invalidPayment)).toThrow();
    });
  });

  describe('validateMonthlyPayment', () => {
    it('should validate a valid monthly payment object', () => {
      const validMonthlyPayment = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        clientName: 'João Silva',
        loanId: '123e4567-e89b-12d3-a456-426614174001',
        dueDate: new Date(),
        interestAmount: 500,
        principalAmount: 0,
        isPaid: false,
        daysOverdue: 0
      };

      expect(() => validateMonthlyPayment(validMonthlyPayment)).not.toThrow();
    });

    it('should throw error for empty client name', () => {
      const invalidMonthlyPayment = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        clientName: '',
        loanId: '123e4567-e89b-12d3-a456-426614174001',
        dueDate: new Date(),
        interestAmount: 500,
        isPaid: false,
        daysOverdue: 0
      };

      expect(() => validateMonthlyPayment(invalidMonthlyPayment)).toThrow();
    });

    it('should throw error for negative days overdue', () => {
      const invalidMonthlyPayment = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        clientName: 'João Silva',
        loanId: '123e4567-e89b-12d3-a456-426614174001',
        dueDate: new Date(),
        interestAmount: 500,
        isPaid: false,
        daysOverdue: -5
      };

      expect(() => validateMonthlyPayment(invalidMonthlyPayment)).toThrow();
    });
  });

  describe('validateNewPaymentForm', () => {
    it('should validate a valid new payment form', () => {
      const validNewPaymentForm = {
        loanId: '123e4567-e89b-12d3-a456-426614174001',
        date: new Date(),
        interestAmount: 500,
        principalAmount: 1000,
        paymentType: 'JUROS_PRINCIPAL'
      };

      expect(() => validateNewPaymentForm(validNewPaymentForm)).not.toThrow();
    });

    it('should throw error when both amounts are zero', () => {
      const invalidNewPaymentForm = {
        loanId: '123e4567-e89b-12d3-a456-426614174001',
        date: new Date(),
        interestAmount: 0,
        principalAmount: 0,
        paymentType: 'JUROS'
      };

      expect(() => validateNewPaymentForm(invalidNewPaymentForm)).toThrow();
    });

    it('should validate when only interest amount is provided', () => {
      const validNewPaymentForm = {
        loanId: '123e4567-e89b-12d3-a456-426614174001',
        date: new Date(),
        interestAmount: 500,
        principalAmount: 0,
        paymentType: 'JUROS'
      };

      expect(() => validateNewPaymentForm(validNewPaymentForm)).not.toThrow();
    });

    it('should throw error for future date beyond today', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const invalidNewPaymentForm = {
        loanId: '123e4567-e89b-12d3-a456-426614174001',
        date: futureDate,
        interestAmount: 500,
        principalAmount: 0,
        paymentType: 'JUROS'
      };

      expect(() => validateNewPaymentForm(invalidNewPaymentForm)).toThrow();
    });

    it('should throw error for date too far in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 31);

      const invalidNewPaymentForm = {
        loanId: '123e4567-e89b-12d3-a456-426614174001',
        date: pastDate,
        interestAmount: 500,
        principalAmount: 0,
        paymentType: 'JUROS'
      };

      expect(() => validateNewPaymentForm(invalidNewPaymentForm)).toThrow();
    });
  });

  describe('validateMonthlyPaymentRegistration', () => {
    it('should validate a valid monthly payment registration', () => {
      const validRegistration = {
        monthlyPaymentId: '123e4567-e89b-12d3-a456-426614174000',
        interestAmount: 500,
        principalAmount: 1000,
        paidDate: new Date()
      };

      expect(() => validateMonthlyPaymentRegistration(validRegistration)).not.toThrow();
    });

    it('should use default values when not provided', () => {
      const minimalRegistration = {
        monthlyPaymentId: '123e4567-e89b-12d3-a456-426614174000',
        interestAmount: 500
      };

      const result = validateMonthlyPaymentRegistration(minimalRegistration);
      expect(result.principalAmount).toBe(0);
      expect(result.paidDate).toBeInstanceOf(Date);
    });
  });

  describe('validatePaymentAmount', () => {
    const mockLoan = {
      remainingBalance: 10000,
      interestRate: 5.0
    };

    it('should validate correct payment amounts', () => {
      const result = validatePaymentAmount(500, 1000, mockLoan);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject principal amount exceeding remaining balance', () => {
      const result = validatePaymentAmount(500, 15000, mockLoan);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valor do principal não pode ser maior que o saldo devedor');
    });

    it('should warn about interest amount significantly different from expected', () => {
      const result = validatePaymentAmount(1000, 1000, mockLoan); // Expected interest is 500 (5% of 10000)
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Valor dos juros muito diferente do esperado');
    });

    it('should allow interest amount within acceptable variance', () => {
      const expectedInterest = (mockLoan.remainingBalance * mockLoan.interestRate) / 100; // 500
      const slightlyHigherInterest = expectedInterest * 1.05; // 5% higher, within 10% variance
      
      const result = validatePaymentAmount(slightlyHigherInterest, 1000, mockLoan);
      expect(result.isValid).toBe(true);
    });
  });

  describe('canRegisterPayment', () => {
    const mockMonthlyPayment = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      loanId: '123e4567-e89b-12d3-a456-426614174001',
      dueDate: new Date('2023-06-15'),
      isPaid: false
    };

    it('should allow registration for unpaid monthly payment', () => {
      const result = canRegisterPayment(mockMonthlyPayment, []);
      expect(result.canRegister).toBe(true);
    });

    it('should reject registration for already paid monthly payment', () => {
      const paidMonthlyPayment = { ...mockMonthlyPayment, isPaid: true };
      const result = canRegisterPayment(paidMonthlyPayment, []);
      expect(result.canRegister).toBe(false);
      expect(result.reason).toContain('já foi registrado');
    });

    it('should reject registration when payment already exists for same month', () => {
      const existingPayments = [
        {
          loanId: '123e4567-e89b-12d3-a456-426614174001',
          date: new Date('2023-06-20') // Same month as due date
        }
      ];

      const result = canRegisterPayment(mockMonthlyPayment, existingPayments);
      expect(result.canRegister).toBe(false);
      expect(result.reason).toContain('Já existe pagamento registrado');
    });

    it('should allow registration when existing payment is for different month', () => {
      const existingPayments = [
        {
          loanId: '123e4567-e89b-12d3-a456-426614174001',
          date: new Date('2023-05-20') // Different month
        }
      ];

      const result = canRegisterPayment(mockMonthlyPayment, existingPayments);
      expect(result.canRegister).toBe(true);
    });
  });

  describe('calculateOverdueDays', () => {
    it('should return 0 for future due date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      
      const overdueDays = calculateOverdueDays(futureDate);
      expect(overdueDays).toBe(0);
    });

    it('should return 0 for today due date', () => {
      const today = new Date();
      const overdueDays = calculateOverdueDays(today);
      expect(overdueDays).toBe(0);
    });

    it('should calculate correct overdue days for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      
      const overdueDays = calculateOverdueDays(pastDate);
      expect(overdueDays).toBe(5);
    });
  });
});