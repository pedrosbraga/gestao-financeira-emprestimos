import { z } from 'zod';

// Common validation schemas
export const uuidSchema = z.string().uuid('ID deve ser um UUID válido');

export const emailSchema = z
  .string()
  .email('Email deve ter um formato válido')
  .min(1, 'Email é obrigatório');

export const phoneSchema = z
  .string()
  .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX')
  .min(1, 'Telefone é obrigatório');

export const documentSchema = z
  .string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 
    'Documento deve ser um CPF (XXX.XXX.XXX-XX) ou CNPJ (XX.XXX.XXX/XXXX-XX) válido')
  .min(1, 'Documento é obrigatório');

export const positiveNumberSchema = z
  .number()
  .positive('Valor deve ser positivo')
  .finite('Valor deve ser um número válido');

export const percentageSchema = z
  .number()
  .min(0, 'Percentual não pode ser negativo')
  .max(100, 'Percentual não pode ser maior que 100%')
  .finite('Percentual deve ser um número válido');

export const dateSchema = z
  .date()
  .refine((date) => date <= new Date(), 'Data não pode ser no futuro');

export const futureDateSchema = z
  .date()
  .refine((date) => date >= new Date(), 'Data deve ser no futuro ou hoje');

// Address validation schema
export const addressSchema = z.object({
  street: z.string().min(1, 'Rua é obrigatória').max(200, 'Rua deve ter no máximo 200 caracteres'),
  number: z.string().min(1, 'Número é obrigatório').max(20, 'Número deve ter no máximo 20 caracteres'),
  city: z.string().min(1, 'Cidade é obrigatória').max(100, 'Cidade deve ter no máximo 100 caracteres'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres (ex: SP)'),
  zipCode: z.string().regex(/^\d{5}-\d{3}$/, 'CEP deve estar no formato XXXXX-XXX')
});

// Reference validation schema
export const referenceSchema = z.object({
  name: z.string().min(1, 'Nome da referência é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  phone: phoneSchema,
  relationship: z.string().min(1, 'Relacionamento é obrigatório').max(50, 'Relacionamento deve ter no máximo 50 caracteres')
});

// Enum schemas
export const userTypeSchema = z.enum(['CEO', 'GERENTE', 'FINANCEIRO'], {
  message: 'Tipo de usuário deve ser CEO, GERENTE ou FINANCEIRO'
});

export const loanSourceSchema = z.enum(['INVESTIMENTO', 'CAIXA'], {
  message: 'Origem deve ser INVESTIMENTO ou CAIXA'
});

export const loanStatusSchema = z.enum(['ATIVO', 'QUITADO', 'INADIMPLENTE'], {
  message: 'Status deve ser ATIVO, QUITADO ou INADIMPLENTE'
});

export const paymentTypeSchema = z.enum(['JUROS', 'JUROS_PRINCIPAL'], {
  message: 'Tipo de pagamento deve ser JUROS ou JUROS_PRINCIPAL'
});