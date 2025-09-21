// User and Authentication Types
export interface User {
  id: string;
  name: string;
  email: string;
  userType: 'CEO' | 'GERENTE' | 'FINANCEIRO';
  permissions: Permission[];
  createdAt: Date;
  lastLogin: Date;
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Client Types
export interface Client {
  id: string;
  name: string;
  document: string;
  phone: string;
  address: Address;
  references: Reference[];
  createdAt: Date;
  loans: Loan[];
}

export interface Address {
  street: string;
  number: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Reference {
  name: string;
  phone: string;
  relationship: string;
}

// Loan Types
export interface Loan {
  id: string;
  clientId: string;
  amount: number;
  interestRate: number;
  startDate: Date;
  source: 'INVESTIMENTO' | 'CAIXA';
  status: 'ATIVO' | 'QUITADO' | 'INADIMPLENTE';
  payments: Payment[];
  remainingBalance: number;
}

export interface Payment {
  id: string;
  loanId: string;
  date: Date;
  interestAmount: number;
  principalAmount: number;
  totalAmount: number;
  paymentType: 'JUROS' | 'JUROS_PRINCIPAL';
}

// Monthly Control Types
export interface MonthlyPayment {
  id: string;
  clientName: string;
  loanId: string;
  dueDate: Date;
  interestAmount: number;
  principalAmount?: number;
  isPaid: boolean;
  paidDate?: Date;
  daysOverdue: number;
}

export interface MonthlyControl {
  month: number;
  year: number;
  payments: MonthlyPayment[];
  totalExpected: number;
  totalReceived: number;
  overdueCount: number;
}

// Summary Types
export interface MonthlySummary {
  month: string;
  year: number;
  investimento: number;
  creditoInvest: number;
  debito: number;
  totalEmp: number;
  creditoJuros: number;
  creditoDiv: number;
  saldoCaixa: number;
  saldoTotal: number;
}

export interface SummaryData {
  summaries: MonthlySummary[];
  totalInvestido: number;
  totalEmprestado: number;
  totalRecebido: number;
}

// Form Types
export interface NewClientForm {
  name: string;
  document: string;
  phone: string;
  address: Address;
  references: Reference[];
}

export interface NewLoanForm {
  clientId: string;
  amount: number;
  interestRate: number;
  startDate: Date;
  source: 'INVESTIMENTO' | 'CAIXA';
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  ClientDetail: { clientId: string };
  NewClient: undefined;
  NewLoan: { clientId?: string };
  PaymentDetail: { paymentId: string };
};

export type MainTabParamList = {
  Summary: undefined;
  Clients: undefined;
  Monthly: undefined;
  Reports: undefined;
};

// Re-export Redux types
export * from './redux';

// Re-export Supabase types
export * from './supabase';
