import { z } from 'zod';
import { uuidSchema, positiveNumberSchema, percentageSchema, dateSchema, loanSourceSchema, loanStatusSchema } from './commonValidators';

// Loan validation schema
export const loanSchema = z.object({
  id: uuidSchema,
  clientId: uuidSchema,
  amount: positiveNumberSchema,
  interestRate: percentageSchema,
  startDate: z.date(),
  source: loanSourceSchema,
  status: loanStatusSchema,
  payments: z.array(z.any()).default([]), // Will be validated by paymentSchema when needed
  remainingBalance: z.number().min(0, 'Saldo devedor não pode ser negativo')
});

// New loan form validation schema
export const newLoanFormSchema = z.object({
  clientId: uuidSchema,
  amount: positiveNumberSchema.min(100, 'Valor mínimo do empréstimo é R$ 100,00'),
  interestRate: percentageSchema.min(0.1, 'Taxa de juros mínima é 0,1%').max(50, 'Taxa de juros máxima é 50%'),
  startDate: z.date().refine((date) => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return date >= thirtyDaysAgo && date <= today;
  }, 'Data de início deve estar entre 30 dias atrás e hoje'),
  source: loanSourceSchema
});

// Update loan form validation schema
export const updateLoanFormSchema = z.object({
  interestRate: percentageSchema.min(0.1, 'Taxa de juros mínima é 0,1%').max(50, 'Taxa de juros máxima é 50%'),
  status: loanStatusSchema
});

// Loan search form validation schema
export const loanSearchFormSchema = z.object({
  query: z.string().min(1, 'Digite pelo menos 1 caractere para buscar'),
  searchBy: z.enum(['clientName', 'amount', 'status'], {
    message: 'Tipo de busca deve ser nome do cliente, valor ou status'
  }).default('clientName')
});

// Loan filters validation schema
export const loanFiltersSchema = z.object({
  status: z.enum(['all', 'ATIVO', 'QUITADO', 'INADIMPLENTE']).default('all'),
  source: z.enum(['all', 'INVESTIMENTO', 'CAIXA']).default('all'),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  startDateAfter: z.date().optional(),
  startDateBefore: z.date().optional(),
  clientId: uuidSchema.optional()
}).refine((data) => {
  if (data.minAmount && data.maxAmount) {
    return data.minAmount <= data.maxAmount;
  }
  return true;
}, {
  message: 'Valor mínimo deve ser menor ou igual ao valor máximo',
  path: ['maxAmount']
}).refine((data) => {
  if (data.startDateAfter && data.startDateBefore) {
    return data.startDateAfter <= data.startDateBefore;
  }
  return true;
}, {
  message: 'Data inicial deve ser anterior à data final',
  path: ['startDateBefore']
});

// Loan calculation validation schema
export const loanCalculationSchema = z.object({
  amount: positiveNumberSchema,
  interestRate: percentageSchema,
  months: z.number().int().min(1, 'Período mínimo é 1 mês').max(120, 'Período máximo é 120 meses')
});

// Validation functions
export const validateLoan = (data: unknown) => loanSchema.parse(data);
export const validateNewLoanForm = (data: unknown) => newLoanFormSchema.parse(data);
export const validateUpdateLoanForm = (data: unknown) => updateLoanFormSchema.parse(data);
export const validateLoanSearchForm = (data: unknown) => loanSearchFormSchema.parse(data);
export const validateLoanFilters = (data: unknown) => loanFiltersSchema.parse(data);
export const validateLoanCalculation = (data: unknown) => loanCalculationSchema.parse(data);

// Business logic validation functions
export const validateLoanAmount = (amount: number, clientHistory?: { totalBorrowed: number; totalPaid: number }): boolean => {
  // Maximum loan amount based on client history
  const maxLoanAmount = 100000; // R$ 100,000 default max
  
  if (amount > maxLoanAmount) return false;
  
  if (clientHistory) {
    const clientLimit = Math.max(10000, clientHistory.totalPaid * 2); // Minimum R$ 10,000 or 2x what they've paid
    return amount <= clientLimit;
  }
  
  return true;
};

export const validateInterestRate = (rate: number, loanAmount: number): boolean => {
  // Higher amounts might have lower rates
  if (loanAmount >= 50000 && rate > 10) return false; // Max 10% for loans >= R$ 50,000
  if (loanAmount >= 20000 && rate > 15) return false; // Max 15% for loans >= R$ 20,000
  
  return rate >= 0.1 && rate <= 50;
};

export const canCreateLoan = (clientId: string, activeLoans: any[]): { canCreate: boolean; reason?: string } => {
  const clientActiveLoans = activeLoans.filter(loan => loan.clientId === clientId && loan.status === 'ATIVO');
  
  if (clientActiveLoans.length >= 3) {
    return { canCreate: false, reason: 'Cliente já possui 3 empréstimos ativos (limite máximo)' };
  }
  
  const totalActiveAmount = clientActiveLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
  if (totalActiveAmount >= 200000) {
    return { canCreate: false, reason: 'Cliente já possui mais de R$ 200.000 em empréstimos ativos' };
  }
  
  return { canCreate: true };
};