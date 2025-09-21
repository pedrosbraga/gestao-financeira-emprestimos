import { z } from 'zod';
import { uuidSchema, documentSchema, phoneSchema, addressSchema, referenceSchema } from './commonValidators';

// Client validation schema
export const clientSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  document: documentSchema,
  phone: phoneSchema,
  address: addressSchema,
  references: z.array(referenceSchema).min(1, 'Pelo menos uma referência é obrigatória').max(3, 'Máximo 3 referências'),
  createdAt: z.date(),
  loans: z.array(z.any()).default([]) // Will be validated by loanSchema when needed
});

// New client form validation schema
export const newClientFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  document: documentSchema,
  phone: phoneSchema,
  address: addressSchema,
  references: z.array(referenceSchema).min(1, 'Pelo menos uma referência é obrigatória').max(3, 'Máximo 3 referências')
});

// Update client form validation schema
export const updateClientFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  phone: phoneSchema,
  address: addressSchema,
  references: z.array(referenceSchema).min(1, 'Pelo menos uma referência é obrigatória').max(3, 'Máximo 3 referências')
});

// Client search form validation schema
export const clientSearchFormSchema = z.object({
  query: z.string().min(1, 'Digite pelo menos 1 caractere para buscar'),
  searchBy: z.enum(['name', 'document', 'phone'], {
    message: 'Tipo de busca deve ser nome, documento ou telefone'
  }).default('name')
});

// Client filters validation schema
export const clientFiltersSchema = z.object({
  status: z.enum(['all', 'active', 'inactive']).default('all'),
  hasActiveLoans: z.boolean().optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional()
});

// Validation functions
export const validateClient = (data: unknown) => clientSchema.parse(data);
export const validateNewClientForm = (data: unknown) => newClientFormSchema.parse(data);
export const validateUpdateClientForm = (data: unknown) => updateClientFormSchema.parse(data);
export const validateClientSearchForm = (data: unknown) => clientSearchFormSchema.parse(data);
export const validateClientFilters = (data: unknown) => clientFiltersSchema.parse(data);

// Custom validation functions
export const validateClientDocument = (document: string): boolean => {
  // Remove formatting
  const cleanDoc = document.replace(/[^\d]/g, '');
  
  if (cleanDoc.length === 11) {
    // CPF validation
    return validateCPF(cleanDoc);
  } else if (cleanDoc.length === 14) {
    // CNPJ validation
    return validateCNPJ(cleanDoc);
  }
  
  return false;
};

const validateCPF = (cpf: string): boolean => {
  // Basic CPF validation algorithm
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;
  
  return parseInt(cpf[9]) === digit1 && parseInt(cpf[10]) === digit2;
};

const validateCNPJ = (cnpj: string): boolean => {
  // Basic CNPJ validation algorithm
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * weights1[i];
  }
  let digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * weights2[i];
  }
  let digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  return parseInt(cnpj[12]) === digit1 && parseInt(cnpj[13]) === digit2;
};