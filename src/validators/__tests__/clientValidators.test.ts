import {
  validateClient,
  validateNewClientForm,
  validateUpdateClientForm,
  validateClientDocument,
  validateClientSearchForm,
  validateClientFilters
} from '../clientValidators';

describe('Client Validators', () => {
  const validAddress = {
    street: 'Rua das Flores',
    number: '123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567'
  };

  const validReference = {
    name: 'Maria Silva',
    phone: '(11) 99999-9999',
    relationship: 'Amiga'
  };

  describe('validateClient', () => {
    it('should validate a valid client object', () => {
      const validClient = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'João Silva',
        document: '123.456.789-01',
        phone: '(11) 99999-9999',
        address: validAddress,
        references: [validReference],
        createdAt: new Date(),
        loans: []
      };

      expect(() => validateClient(validClient)).not.toThrow();
    });

    it('should throw error for invalid document format', () => {
      const invalidClient = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'João Silva',
        document: '123456789',
        phone: '(11) 99999-9999',
        address: validAddress,
        references: [validReference],
        createdAt: new Date(),
        loans: []
      };

      expect(() => validateClient(invalidClient)).toThrow();
    });

    it('should throw error for invalid phone format', () => {
      const invalidClient = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'João Silva',
        document: '123.456.789-01',
        phone: '11999999999',
        address: validAddress,
        references: [validReference],
        createdAt: new Date(),
        loans: []
      };

      expect(() => validateClient(invalidClient)).toThrow();
    });

    it('should throw error for empty references array', () => {
      const invalidClient = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'João Silva',
        document: '123.456.789-01',
        phone: '(11) 99999-9999',
        address: validAddress,
        references: [],
        createdAt: new Date(),
        loans: []
      };

      expect(() => validateClient(invalidClient)).toThrow();
    });
  });

  describe('validateNewClientForm', () => {
    it('should validate a valid new client form', () => {
      const validNewClientForm = {
        name: 'João Silva',
        document: '123.456.789-01',
        phone: '(11) 99999-9999',
        address: validAddress,
        references: [validReference]
      };

      expect(() => validateNewClientForm(validNewClientForm)).not.toThrow();
    });

    it('should throw error for too many references', () => {
      const invalidNewClientForm = {
        name: 'João Silva',
        document: '123.456.789-01',
        phone: '(11) 99999-9999',
        address: validAddress,
        references: [validReference, validReference, validReference, validReference] // 4 references
      };

      expect(() => validateNewClientForm(invalidNewClientForm)).toThrow();
    });
  });

  describe('validateClientDocument', () => {
    it('should validate a valid CPF', () => {
      // Using a valid CPF format (this is a test CPF, not real)
      const validCPF = '111.444.777-35';
      expect(validateClientDocument(validCPF)).toBe(true);
    });

    it('should validate a valid CNPJ', () => {
      // Using a valid CNPJ format (this is a test CNPJ, not real)
      const validCNPJ = '11.222.333/0001-81';
      expect(validateClientDocument(validCNPJ)).toBe(true);
    });

    it('should reject invalid CPF', () => {
      const invalidCPF = '123.456.789-00';
      expect(validateClientDocument(invalidCPF)).toBe(false);
    });

    it('should reject invalid CNPJ', () => {
      const invalidCNPJ = '11.222.333/0001-00';
      expect(validateClientDocument(invalidCNPJ)).toBe(false);
    });

    it('should reject sequential numbers', () => {
      const sequentialCPF = '111.111.111-11';
      expect(validateClientDocument(sequentialCPF)).toBe(false);
    });

    it('should reject wrong length', () => {
      const shortDocument = '123.456.789';
      expect(validateClientDocument(shortDocument)).toBe(false);
    });
  });

  describe('validateClientSearchForm', () => {
    it('should validate a valid search form', () => {
      const validSearchForm = {
        query: 'João',
        searchBy: 'name'
      };

      expect(() => validateClientSearchForm(validSearchForm)).not.toThrow();
    });

    it('should throw error for empty query', () => {
      const invalidSearchForm = {
        query: '',
        searchBy: 'name'
      };

      expect(() => validateClientSearchForm(invalidSearchForm)).toThrow();
    });

    it('should throw error for invalid searchBy', () => {
      const invalidSearchForm = {
        query: 'João',
        searchBy: 'invalid'
      };

      expect(() => validateClientSearchForm(invalidSearchForm)).toThrow();
    });
  });

  describe('validateClientFilters', () => {
    it('should validate valid filters', () => {
      const validFilters = {
        status: 'active',
        hasActiveLoans: true,
        createdAfter: new Date('2023-01-01'),
        createdBefore: new Date('2023-12-31')
      };

      expect(() => validateClientFilters(validFilters)).not.toThrow();
    });

    it('should validate with default values', () => {
      const minimalFilters = {};

      expect(() => validateClientFilters(minimalFilters)).not.toThrow();
    });

    it('should throw error for invalid status', () => {
      const invalidFilters = {
        status: 'invalid'
      };

      expect(() => validateClientFilters(invalidFilters)).toThrow();
    });
  });
});