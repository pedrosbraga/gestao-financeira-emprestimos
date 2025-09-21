import AuthService, { UserType } from '../AuthService';

// Simple test without complex mocking
describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = AuthService.getInstance();
  });

  describe('Singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AuthService.getInstance();
      const instance2 = AuthService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('hasPermission', () => {
    it('should return true for CEO with any permission', () => {
      expect(authService.hasPermission('CEO', 'read_all')).toBe(true);
      expect(authService.hasPermission('CEO', 'write_all')).toBe(true);
      expect(authService.hasPermission('CEO', 'delete_all')).toBe(true);
      expect(authService.hasPermission('CEO', 'manage_users')).toBe(true);
    });

    it('should return correct permissions for GERENTE', () => {
      expect(authService.hasPermission('GERENTE', 'read_all')).toBe(true);
      expect(authService.hasPermission('GERENTE', 'write_all')).toBe(true);
      expect(authService.hasPermission('GERENTE', 'manage_users')).toBe(false);
      expect(authService.hasPermission('GERENTE', 'delete_all')).toBe(false);
    });

    it('should return correct permissions for FINANCEIRO', () => {
      expect(authService.hasPermission('FINANCEIRO', 'read_payments')).toBe(true);
      expect(authService.hasPermission('FINANCEIRO', 'manage_payments')).toBe(true);
      expect(authService.hasPermission('FINANCEIRO', 'read_all')).toBe(false);
      expect(authService.hasPermission('FINANCEIRO', 'write_all')).toBe(false);
    });

    it('should return false for invalid permissions', () => {
      expect(authService.hasPermission('CEO', 'invalid_permission')).toBe(false);
      expect(authService.hasPermission('GERENTE', 'invalid_permission')).toBe(false);
      expect(authService.hasPermission('FINANCEIRO', 'invalid_permission')).toBe(false);
    });
  });

  describe('Permission validation', () => {
    it('should validate CEO permissions correctly', () => {
      const ceoPermissions = [
        'read_all', 'write_all', 'delete_all', 'manage_users',
        'view_reports', 'manage_clients', 'manage_loans', 'manage_payments'
      ];

      ceoPermissions.forEach(permission => {
        expect(authService.hasPermission('CEO', permission)).toBe(true);
      });
    });

    it('should validate GERENTE permissions correctly', () => {
      const gerentePermissions = [
        'read_all', 'write_all', 'view_reports', 
        'manage_clients', 'manage_loans', 'manage_payments'
      ];
      
      const deniedPermissions = ['delete_all', 'manage_users'];

      gerentePermissions.forEach(permission => {
        expect(authService.hasPermission('GERENTE', permission)).toBe(true);
      });

      deniedPermissions.forEach(permission => {
        expect(authService.hasPermission('GERENTE', permission)).toBe(false);
      });
    });

    it('should validate FINANCEIRO permissions correctly', () => {
      const financeiroPermissions = [
        'read_payments', 'manage_payments', 'view_monthly_control'
      ];
      
      const deniedPermissions = [
        'read_all', 'write_all', 'delete_all', 'manage_users',
        'view_reports', 'manage_clients', 'manage_loans'
      ];

      financeiroPermissions.forEach(permission => {
        expect(authService.hasPermission('FINANCEIRO', permission)).toBe(true);
      });

      deniedPermissions.forEach(permission => {
        expect(authService.hasPermission('FINANCEIRO', permission)).toBe(false);
      });
    });
  });
});