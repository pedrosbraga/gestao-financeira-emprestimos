import { z } from 'zod';
import { uuidSchema, positiveNumberSchema, dateSchema, paymentTypeSchema } from './commonValidators';

// Payment validation schema
export const paymentSchema = z.object({
  id: uuidSchema,
  loanId: uuidSchema,
  date: z.date(),
  interestAmount: z.number().min(0, 'Valor dos juros não pode ser negativo'),
  principalAmount: z.number().min(0, 'Valor do principal não pode ser negativo'),
  totalAmount: positiveNumberSchema,
  paymentType: paymentTypeSchema
}).refine((data) => {
  return Math.abs(data.totalAmount - (data.interestAmount + data.principalAmount)) < 0.01;
}, {
  message: 'Valor total deve ser igual à soma dos juros e principal',
  path: ['totalAmount']
});

// Monthly payment validation schema
export const monthlyPaymentSchema = z.object({
  id: uuidSchema,
  clientName: z.string().min(1, 'Nome do cliente é obrigatório'),
  loanId: uuidSchema,
  dueDate: z.date(),
  interestAmount: positiveNumberSchema,
  principalAmount: z.number().min(0, 'Valor do principal não pode ser negativo').optional(),
  isPaid: z.boolean(),
  paidDate: z.date().optional(),
  daysOverdue: z.number().int().min(0, 'Dias em atraso não pode ser negativo')
});

// New payment form validation schema
export const newPaymentFormSchema = z.object({
  loanId: uuidSchema,
  date: z.date().refine((date) => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return date >= thirtyDaysAgo && date <= today;
  }, 'Data do pagamento deve estar entre 30 dias atrás e hoje'),
  interestAmount: z.number().min(0, 'Valor dos juros não pode ser negativo'),
  principalAmount: z.number().min(0, 'Valor do principal não pode ser negativo'),
  paymentType: paymentTypeSchema
}).refine((data) => {
  return data.interestAmount > 0 || data.principalAmount > 0;
}, {
  message: 'Pelo menos um valor (juros ou principal) deve ser maior que zero',
  path: ['interestAmount']
});

// Monthly payment registration schema
export const monthlyPaymentRegistrationSchema = z.object({
  monthlyPaymentId: uuidSchema,
  interestAmount: positiveNumberSchema,
  principalAmount: z.number().min(0, 'Valor do principal não pode ser negativo').default(0),
  paidDate: z.date().default(() => new Date())
});

// Payment search form validation schema
export const paymentSearchFormSchema = z.object({
  query: z.string().min(1, 'Digite pelo menos 1 caractere para buscar'),
  searchBy: z.enum(['clientName', 'amount', 'date'], {
    message: 'Tipo de busca deve ser nome do cliente, valor ou data'
  }).default('clientName')
});

// Payment filters validation schema
export const paymentFiltersSchema = z.object({
  paymentType: z.enum(['all', 'JUROS', 'JUROS_PRINCIPAL']).default('all'),
  dateAfter: z.date().optional(),
  dateBefore: z.date().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  clientId: uuidSchema.optional(),
  loanId: uuidSchema.optional()
}).refine((data) => {
  if (data.minAmount && data.maxAmount) {
    return data.minAmount <= data.maxAmount;
  }
  return true;
}, {
  message: 'Valor mínimo deve ser menor ou igual ao valor máximo',
  path: ['maxAmount']
}).refine((data) => {
  if (data.dateAfter && data.dateBefore) {
    return data.dateAfter <= data.dateBefore;
  }
  return true;
}, {
  message: 'Data inicial deve ser anterior à data final',
  path: ['dateBefore']
});

// Monthly control validation schema
export const monthlyControlSchema = z.object({
  month: z.number().int().min(1, 'Mês deve estar entre 1 e 12').max(12, 'Mês deve estar entre 1 e 12'),
  year: z.number().int().min(2020, 'Ano deve ser maior que 2020').max(2050, 'Ano deve ser menor que 2050'),
  payments: z.array(monthlyPaymentSchema),
  totalExpected: z.number().min(0, 'Total esperado não pode ser negativo'),
  totalReceived: z.number().min(0, 'Total recebido não pode ser negativo'),
  overdueCount: z.number().int().min(0, 'Quantidade de inadimplentes não pode ser negativa')
});

// Validation functions
export const validatePayment = (data: unknown) => paymentSchema.parse(data);
export const validateMonthlyPayment = (data: unknown) => monthlyPaymentSchema.parse(data);
export const validateNewPaymentForm = (data: unknown) => newPaymentFormSchema.parse(data);
export const validateMonthlyPaymentRegistration = (data: unknown) => monthlyPaymentRegistrationSchema.parse(data);
export const validatePaymentSearchForm = (data: unknown) => paymentSearchFormSchema.parse(data);
export const validatePaymentFilters = (data: unknown) => paymentFiltersSchema.parse(data);
export const validateMonthlyControl = (data: unknown) => monthlyControlSchema.parse(data);

// Business logic validation functions
export const validatePaymentAmount = (
  interestAmount: number, 
  principalAmount: number, 
  loan: { remainingBalance: number; interestRate: number }
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Principal amount cannot exceed remaining balance
  if (principalAmount > loan.remainingBalance) {
    errors.push('Valor do principal não pode ser maior que o saldo devedor');
  }
  
  // Calculate expected monthly interest
  const expectedMonthlyInterest = (loan.remainingBalance * loan.interestRate) / 100;
  
  // Interest amount should not be significantly different from expected (allow 10% variance)
  if (interestAmount > 0 && Math.abs(interestAmount - expectedMonthlyInterest) > expectedMonthlyInterest * 0.1) {
    errors.push(`Valor dos juros muito diferente do esperado (R$ ${expectedMonthlyInterest.toFixed(2)})`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const canRegisterPayment = (
  monthlyPayment: any,
  existingPayments: any[]
): { canRegister: boolean; reason?: string } => {
  if (monthlyPayment.isPaid) {
    return { canRegister: false, reason: 'Pagamento já foi registrado' };
  }
  
  // Check if there are any payments for this loan in the same month
  const sameMonthPayments = existingPayments.filter(payment => {
    const paymentDate = new Date(payment.date);
    const dueDate = new Date(monthlyPayment.dueDate);
    return payment.loanId === monthlyPayment.loanId &&
           paymentDate.getMonth() === dueDate.getMonth() &&
           paymentDate.getFullYear() === dueDate.getFullYear();
  });
  
  if (sameMonthPayments.length > 0) {
    return { canRegister: false, reason: 'Já existe pagamento registrado para este empréstimo no mês' };
  }
  
  return { canRegister: true };
};

export const calculateOverdueDays = (dueDate: Date): number => {
  const today = new Date();
  const due = new Date(dueDate);
  
  if (today <= due) return 0;
  
  const diffTime = today.getTime() - due.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};