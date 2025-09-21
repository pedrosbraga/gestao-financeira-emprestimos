import { z } from 'zod';

// Monthly summary validation schema
export const monthlySummarySchema = z.object({
  month: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Mês deve estar no formato MM (01-12)'),
  year: z.number().int().min(2020, 'Ano deve ser maior que 2020').max(2050, 'Ano deve ser menor que 2050'),
  investimento: z.number().default(0),
  creditoInvest: z.number().default(0),
  debito: z.number().default(0),
  totalEmp: z.number().min(0, 'Total emprestado não pode ser negativo').default(0),
  creditoJuros: z.number().min(0, 'Crédito de juros não pode ser negativo').default(0),
  creditoDiv: z.number().min(0, 'Crédito de dívida não pode ser negativo').default(0),
  saldoCaixa: z.number().default(0),
  saldoTotal: z.number().default(0)
});

// Summary data validation schema
export const summaryDataSchema = z.object({
  summaries: z.array(monthlySummarySchema),
  totalInvestido: z.number().default(0),
  totalEmprestado: z.number().min(0, 'Total emprestado não pode ser negativo').default(0),
  totalRecebido: z.number().min(0, 'Total recebido não pode ser negativo').default(0)
});

// Summary filters validation schema
export const summaryFiltersSchema = z.object({
  startMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Mês inicial deve estar no formato MM (01-12)').optional(),
  startYear: z.number().int().min(2020).max(2050).optional(),
  endMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Mês final deve estar no formato MM (01-12)').optional(),
  endYear: z.number().int().min(2020).max(2050).optional(),
  showOnlyPositive: z.boolean().default(false),
  groupBy: z.enum(['month', 'quarter', 'year']).default('month')
}).refine((data) => {
  if (data.startYear && data.endYear && data.startMonth && data.endMonth) {
    const startDate = new Date(data.startYear, parseInt(data.startMonth) - 1);
    const endDate = new Date(data.endYear, parseInt(data.endMonth) - 1);
    return startDate <= endDate;
  }
  return true;
}, {
  message: 'Período inicial deve ser anterior ao período final',
  path: ['endMonth']
});

// Investment transaction validation schema
export const investmentTransactionSchema = z.object({
  type: z.enum(['APORTE', 'RETIRADA'], {
    message: 'Tipo deve ser APORTE ou RETIRADA'
  }),
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.date(),
  description: z.string().min(1, 'Descrição é obrigatória').max(200, 'Descrição deve ter no máximo 200 caracteres'),
  partnerId: z.string().optional() // For tracking which partner made the investment
});

// Cash flow validation schema
export const cashFlowSchema = z.object({
  date: z.date(),
  type: z.enum(['ENTRADA', 'SAIDA'], {
    message: 'Tipo deve ser ENTRADA ou SAIDA'
  }),
  category: z.enum(['EMPRESTIMO', 'PAGAMENTO_JUROS', 'PAGAMENTO_PRINCIPAL', 'INVESTIMENTO', 'RETIRADA'], {
    message: 'Categoria inválida'
  }),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().max(200, 'Descrição deve ter no máximo 200 caracteres').optional(),
  relatedId: z.string().optional() // ID of related loan, payment, etc.
});

// Summary calculation validation schema
export const summaryCalculationSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2050),
  transactions: z.array(cashFlowSchema)
});

// Validation functions
export const validateMonthlySummary = (data: unknown) => monthlySummarySchema.parse(data);
export const validateSummaryData = (data: unknown) => summaryDataSchema.parse(data);
export const validateSummaryFilters = (data: unknown) => summaryFiltersSchema.parse(data);
export const validateInvestmentTransaction = (data: unknown) => investmentTransactionSchema.parse(data);
export const validateCashFlow = (data: unknown) => cashFlowSchema.parse(data);
export const validateSummaryCalculation = (data: unknown) => summaryCalculationSchema.parse(data);

// Business logic validation functions
export const validateInvestmentAmount = (
  type: 'APORTE' | 'RETIRADA',
  amount: number,
  currentBalance: number
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (type === 'RETIRADA' && amount > currentBalance) {
    errors.push('Valor da retirada não pode ser maior que o saldo disponível');
  }
  
  if (amount < 100) {
    errors.push('Valor mínimo para transações é R$ 100,00');
  }
  
  if (amount > 1000000) {
    errors.push('Valor máximo para transações é R$ 1.000.000,00');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const calculateMonthlySummary = (
  month: number,
  year: number,
  transactions: any[]
): any => {
  const monthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() + 1 === month && transactionDate.getFullYear() === year;
  });
  
  let investimento = 0;
  let creditoInvest = 0;
  let debito = 0;
  let totalEmp = 0;
  let creditoJuros = 0;
  let creditoDiv = 0;
  
  monthTransactions.forEach(transaction => {
    switch (transaction.category) {
      case 'INVESTIMENTO':
        if (transaction.type === 'ENTRADA') {
          investimento += transaction.amount;
        } else {
          creditoInvest += transaction.amount;
        }
        break;
      case 'EMPRESTIMO':
        debito += transaction.amount;
        totalEmp += transaction.amount;
        break;
      case 'PAGAMENTO_JUROS':
        creditoJuros += transaction.amount;
        break;
      case 'PAGAMENTO_PRINCIPAL':
        creditoDiv += transaction.amount;
        break;
    }
  });
  
  const saldoCaixa = investimento - creditoInvest - debito + creditoJuros + creditoDiv;
  const saldoTotal = saldoCaixa + totalEmp - creditoDiv; // Total emprestado menos o que já foi pago do principal
  
  return {
    month: month.toString().padStart(2, '0'),
    year,
    investimento,
    creditoInvest,
    debito,
    totalEmp,
    creditoJuros,
    creditoDiv,
    saldoCaixa,
    saldoTotal
  };
};

export const validateSummaryConsistency = (summaries: any[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check if summaries are in chronological order
  for (let i = 1; i < summaries.length; i++) {
    const current = summaries[i];
    const previous = summaries[i - 1];
    
    const currentDate = new Date(current.year, parseInt(current.month) - 1);
    const previousDate = new Date(previous.year, parseInt(previous.month) - 1);
    
    if (currentDate < previousDate) {
      errors.push('Resumos devem estar em ordem cronológica');
      break;
    }
  }
  
  // Check for negative balances that don't make sense
  summaries.forEach((summary, index) => {
    if (summary.totalEmp < 0) {
      errors.push(`Total emprestado não pode ser negativo no mês ${summary.month}/${summary.year}`);
    }
    
    if (summary.creditoJuros < 0) {
      errors.push(`Crédito de juros não pode ser negativo no mês ${summary.month}/${summary.year}`);
    }
    
    if (summary.creditoDiv < 0) {
      errors.push(`Crédito de dívida não pode ser negativo no mês ${summary.month}/${summary.year}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};