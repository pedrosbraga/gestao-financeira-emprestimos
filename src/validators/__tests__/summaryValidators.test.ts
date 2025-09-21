import {
  validateMonthlySummary,
  validateSummaryData,
  validateSummaryFilters,
  validateInvestmentAmount,
  calculateMonthlySummary,
  validateSummaryConsistency
} from '../summaryValidators';

describe('Summary Validators', () => {
  describe('validateMonthlySummary', () => {
    it('should validate a valid monthly summary object', () => {
      const validMonthlySummary = {
        month: '06',
        year: 2023,
        investimento: 50000,
        creditoInvest: 0,
        debito: 30000,
        totalEmp: 30000,
        creditoJuros: 1500,
        creditoDiv: 5000,
        saldoCaixa: 26500,
        saldoTotal: 51500
      };

      expect(() => validateMonthlySummary(validMonthlySummary)).not.toThrow();
    });

    it('should throw error for invalid month format', () => {
      const invalidMonthlySummary = {
        month: '6', // Should be '06'
        year: 2023,
        investimento: 50000,
        creditoInvest: 0,
        debito: 30000,
        totalEmp: 30000,
        creditoJuros: 1500,
        creditoDiv: 5000,
        saldoCaixa: 26500,
        saldoTotal: 51500
      };

      expect(() => validateMonthlySummary(invalidMonthlySummary)).toThrow();
    });

    it('should throw error for invalid month value', () => {
      const invalidMonthlySummary = {
        month: '13', // Invalid month
        year: 2023,
        investimento: 50000,
        creditoInvest: 0,
        debito: 30000,
        totalEmp: 30000,
        creditoJuros: 1500,
        creditoDiv: 5000,
        saldoCaixa: 26500,
        saldoTotal: 51500
      };

      expect(() => validateMonthlySummary(invalidMonthlySummary)).toThrow();
    });

    it('should throw error for negative total emprestado', () => {
      const invalidMonthlySummary = {
        month: '06',
        year: 2023,
        investimento: 50000,
        creditoInvest: 0,
        debito: 30000,
        totalEmp: -30000, // Negative value
        creditoJuros: 1500,
        creditoDiv: 5000,
        saldoCaixa: 26500,
        saldoTotal: 51500
      };

      expect(() => validateMonthlySummary(invalidMonthlySummary)).toThrow();
    });

    it('should use default values for optional fields', () => {
      const minimalSummary = {
        month: '06',
        year: 2023
      };

      const result = validateMonthlySummary(minimalSummary);
      expect(result.investimento).toBe(0);
      expect(result.creditoInvest).toBe(0);
      expect(result.debito).toBe(0);
    });
  });

  describe('validateSummaryData', () => {
    it('should validate valid summary data', () => {
      const validSummaryData = {
        summaries: [
          {
            month: '06',
            year: 2023,
            investimento: 50000,
            creditoInvest: 0,
            debito: 30000,
            totalEmp: 30000,
            creditoJuros: 1500,
            creditoDiv: 5000,
            saldoCaixa: 26500,
            saldoTotal: 51500
          }
        ],
        totalInvestido: 50000,
        totalEmprestado: 30000,
        totalRecebido: 6500
      };

      expect(() => validateSummaryData(validSummaryData)).not.toThrow();
    });

    it('should throw error for negative total emprestado', () => {
      const invalidSummaryData = {
        summaries: [],
        totalInvestido: 50000,
        totalEmprestado: -30000, // Negative value
        totalRecebido: 6500
      };

      expect(() => validateSummaryData(invalidSummaryData)).toThrow();
    });

    it('should use default values', () => {
      const minimalSummaryData = {
        summaries: []
      };

      const result = validateSummaryData(minimalSummaryData);
      expect(result.totalInvestido).toBe(0);
      expect(result.totalEmprestado).toBe(0);
      expect(result.totalRecebido).toBe(0);
    });
  });

  describe('validateSummaryFilters', () => {
    it('should validate valid summary filters', () => {
      const validFilters = {
        startMonth: '01',
        startYear: 2023,
        endMonth: '12',
        endYear: 2023,
        showOnlyPositive: true,
        groupBy: 'month'
      };

      expect(() => validateSummaryFilters(validFilters)).not.toThrow();
    });

    it('should throw error when start period is after end period', () => {
      const invalidFilters = {
        startMonth: '12',
        startYear: 2023,
        endMonth: '01',
        endYear: 2023
      };

      expect(() => validateSummaryFilters(invalidFilters)).toThrow();
    });

    it('should throw error when start year is after end year', () => {
      const invalidFilters = {
        startMonth: '01',
        startYear: 2024,
        endMonth: '12',
        endYear: 2023
      };

      expect(() => validateSummaryFilters(invalidFilters)).toThrow();
    });

    it('should use default values', () => {
      const minimalFilters = {};

      const result = validateSummaryFilters(minimalFilters);
      expect(result.showOnlyPositive).toBe(false);
      expect(result.groupBy).toBe('month');
    });
  });

  describe('validateInvestmentAmount', () => {
    it('should validate valid investment amount', () => {
      const result = validateInvestmentAmount('APORTE', 10000, 50000);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject withdrawal exceeding current balance', () => {
      const result = validateInvestmentAmount('RETIRADA', 60000, 50000);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valor da retirada não pode ser maior que o saldo disponível');
    });

    it('should reject amount below minimum', () => {
      const result = validateInvestmentAmount('APORTE', 50, 50000);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valor mínimo para transações é R$ 100,00');
    });

    it('should reject amount above maximum', () => {
      const result = validateInvestmentAmount('APORTE', 1500000, 50000);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valor máximo para transações é R$ 1.000.000,00');
    });

    it('should allow valid withdrawal within balance', () => {
      const result = validateInvestmentAmount('RETIRADA', 30000, 50000);
      expect(result.isValid).toBe(true);
    });
  });

  describe('calculateMonthlySummary', () => {
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
      },
      {
        date: new Date('2023-06-30'),
        type: 'ENTRADA',
        category: 'PAGAMENTO_PRINCIPAL',
        amount: 5000
      },
      {
        date: new Date('2023-05-15'), // Different month, should be ignored
        type: 'ENTRADA',
        category: 'INVESTIMENTO',
        amount: 20000
      }
    ];

    it('should calculate monthly summary correctly', () => {
      const result = calculateMonthlySummary(6, 2023, mockTransactions);

      expect(result.month).toBe('06');
      expect(result.year).toBe(2023);
      expect(result.investimento).toBe(50000);
      expect(result.creditoInvest).toBe(0);
      expect(result.debito).toBe(30000);
      expect(result.totalEmp).toBe(30000);
      expect(result.creditoJuros).toBe(1500);
      expect(result.creditoDiv).toBe(5000);
      expect(result.saldoCaixa).toBe(26500); // 50000 - 0 - 30000 + 1500 + 5000
      expect(result.saldoTotal).toBe(51500); // 26500 + 30000 - 5000
    });

    it('should handle empty transactions', () => {
      const result = calculateMonthlySummary(6, 2023, []);

      expect(result.investimento).toBe(0);
      expect(result.creditoInvest).toBe(0);
      expect(result.debito).toBe(0);
      expect(result.totalEmp).toBe(0);
      expect(result.creditoJuros).toBe(0);
      expect(result.creditoDiv).toBe(0);
      expect(result.saldoCaixa).toBe(0);
      expect(result.saldoTotal).toBe(0);
    });
  });

  describe('validateSummaryConsistency', () => {
    it('should validate consistent summaries in chronological order', () => {
      const validSummaries = [
        { month: '01', year: 2023, totalEmp: 10000, creditoJuros: 500, creditoDiv: 1000 },
        { month: '02', year: 2023, totalEmp: 15000, creditoJuros: 750, creditoDiv: 1500 },
        { month: '03', year: 2023, totalEmp: 20000, creditoJuros: 1000, creditoDiv: 2000 }
      ];

      const result = validateSummaryConsistency(validSummaries);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject summaries not in chronological order', () => {
      const invalidSummaries = [
        { month: '03', year: 2023, totalEmp: 20000, creditoJuros: 1000, creditoDiv: 2000 },
        { month: '01', year: 2023, totalEmp: 10000, creditoJuros: 500, creditoDiv: 1000 }, // Out of order
        { month: '02', year: 2023, totalEmp: 15000, creditoJuros: 750, creditoDiv: 1500 }
      ];

      const result = validateSummaryConsistency(invalidSummaries);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Resumos devem estar em ordem cronológica');
    });

    it('should reject summaries with negative total emprestado', () => {
      const invalidSummaries = [
        { month: '01', year: 2023, totalEmp: -10000, creditoJuros: 500, creditoDiv: 1000 }
      ];

      const result = validateSummaryConsistency(invalidSummaries);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total emprestado não pode ser negativo no mês 01/2023');
    });

    it('should reject summaries with negative credito juros', () => {
      const invalidSummaries = [
        { month: '01', year: 2023, totalEmp: 10000, creditoJuros: -500, creditoDiv: 1000 }
      ];

      const result = validateSummaryConsistency(invalidSummaries);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Crédito de juros não pode ser negativo no mês 01/2023');
    });

    it('should reject summaries with negative credito divida', () => {
      const invalidSummaries = [
        { month: '01', year: 2023, totalEmp: 10000, creditoJuros: 500, creditoDiv: -1000 }
      ];

      const result = validateSummaryConsistency(invalidSummaries);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Crédito de dívida não pode ser negativo no mês 01/2023');
    });
  });
});