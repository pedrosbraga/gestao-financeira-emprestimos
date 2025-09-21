import {
  validateUser,
  validateAuthState,
  validateLoginForm,
  validateCreateUserForm,
  validateUpdateUserForm,
  validateChangePasswordForm
} from '../userValidators';

describe('User Validators', () => {
  describe('validateUser', () => {
    it('should validate a valid user object', () => {
      const validUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'João Silva',
        email: 'joao@example.com',
        userType: 'CEO',
        permissions: [{ resource: 'loans', actions: ['read', 'write'] }],
        createdAt: new Date(),
        lastLogin: new Date()
      };

      expect(() => validateUser(validUser)).not.toThrow();
    });

    it('should throw error for invalid user type', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'João Silva',
        email: 'joao@example.com',
        userType: 'INVALID',
        permissions: [],
        createdAt: new Date(),
        lastLogin: new Date()
      };

      expect(() => validateUser(invalidUser)).toThrow();
    });

    it('should throw error for invalid email', () => {
      const invalidUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'João Silva',
        email: 'invalid-email',
        userType: 'CEO',
        permissions: [],
        createdAt: new Date(),
        lastLogin: new Date()
      };

      expect(() => validateUser(invalidUser)).toThrow();
    });

    it('should throw error for invalid UUID', () => {
      const invalidUser = {
        id: 'invalid-uuid',
        name: 'João Silva',
        email: 'joao@example.com',
        userType: 'CEO',
        permissions: [],
        createdAt: new Date(),
        lastLogin: new Date()
      };

      expect(() => validateUser(invalidUser)).toThrow();
    });
  });

  describe('validateAuthState', () => {
    it('should validate a valid auth state', () => {
      const validAuthState = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      };

      expect(() => validateAuthState(validAuthState)).not.toThrow();
    });

    it('should validate auth state with user', () => {
      const validAuthState = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'João Silva',
          email: 'joao@example.com',
          userType: 'CEO',
          permissions: [],
          createdAt: new Date(),
          lastLogin: new Date()
        },
        token: 'valid-token',
        isAuthenticated: true,
        isLoading: false
      };

      expect(() => validateAuthState(validAuthState)).not.toThrow();
    });
  });

  describe('validateLoginForm', () => {
    it('should validate a valid login form', () => {
      const validLoginForm = {
        email: 'joao@example.com',
        password: 'password123'
      };

      expect(() => validateLoginForm(validLoginForm)).not.toThrow();
    });

    it('should throw error for invalid email', () => {
      const invalidLoginForm = {
        email: 'invalid-email',
        password: 'password123'
      };

      expect(() => validateLoginForm(invalidLoginForm)).toThrow();
    });

    it('should throw error for short password', () => {
      const invalidLoginForm = {
        email: 'joao@example.com',
        password: '123'
      };

      expect(() => validateLoginForm(invalidLoginForm)).toThrow();
    });
  });

  describe('validateCreateUserForm', () => {
    it('should validate a valid create user form', () => {
      const validCreateUserForm = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'Password123',
        userType: 'GERENTE'
      };

      expect(() => validateCreateUserForm(validCreateUserForm)).not.toThrow();
    });

    it('should throw error for weak password', () => {
      const invalidCreateUserForm = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'password', // Missing uppercase and number
        userType: 'GERENTE'
      };

      expect(() => validateCreateUserForm(invalidCreateUserForm)).toThrow();
    });

    it('should throw error for empty name', () => {
      const invalidCreateUserForm = {
        name: '',
        email: 'joao@example.com',
        password: 'Password123',
        userType: 'GERENTE'
      };

      expect(() => validateCreateUserForm(invalidCreateUserForm)).toThrow();
    });
  });

  describe('validateChangePasswordForm', () => {
    it('should validate a valid change password form', () => {
      const validChangePasswordForm = {
        currentPassword: 'oldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123'
      };

      expect(() => validateChangePasswordForm(validChangePasswordForm)).not.toThrow();
    });

    it('should throw error when passwords do not match', () => {
      const invalidChangePasswordForm = {
        currentPassword: 'oldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'DifferentPassword123'
      };

      expect(() => validateChangePasswordForm(invalidChangePasswordForm)).toThrow();
    });

    it('should throw error for weak new password', () => {
      const invalidChangePasswordForm = {
        currentPassword: 'oldPassword123',
        newPassword: 'weak',
        confirmPassword: 'weak'
      };

      expect(() => validateChangePasswordForm(invalidChangePasswordForm)).toThrow();
    });
  });
});