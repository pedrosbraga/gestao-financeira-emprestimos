import { z } from 'zod';
import { uuidSchema, emailSchema, userTypeSchema } from './commonValidators';

// Permission validation schema
export const permissionSchema = z.object({
  resource: z.string().min(1, 'Recurso é obrigatório'),
  actions: z.array(z.string()).min(1, 'Pelo menos uma ação é obrigatória')
});

// User validation schema
export const userSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: emailSchema,
  userType: userTypeSchema,
  permissions: z.array(permissionSchema),
  createdAt: z.date(),
  lastLogin: z.date()
});

// Auth state validation schema
export const authStateSchema = z.object({
  user: userSchema.nullable(),
  token: z.string().nullable(),
  isAuthenticated: z.boolean(),
  isLoading: z.boolean()
});

// Login form validation schema
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
});

// Create user form validation schema
export const createUserFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: emailSchema,
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  userType: userTypeSchema
});

// Update user form validation schema
export const updateUserFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: emailSchema,
  userType: userTypeSchema
});

// Change password form validation schema
export const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string()
    .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Nova senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Confirmação de senha não confere',
  path: ['confirmPassword']
});

// Validation functions
export const validateUser = (data: unknown) => userSchema.parse(data);
export const validateAuthState = (data: unknown) => authStateSchema.parse(data);
export const validateLoginForm = (data: unknown) => loginFormSchema.parse(data);
export const validateCreateUserForm = (data: unknown) => createUserFormSchema.parse(data);
export const validateUpdateUserForm = (data: unknown) => updateUserFormSchema.parse(data);
export const validateChangePasswordForm = (data: unknown) => changePasswordFormSchema.parse(data);