import { 
  User, 
  Client, 
  Loan, 
  Payment, 
  MonthlyPayment, 
  MonthlyControl, 
  MonthlySummary, 
  SummaryData 
} from './index';

// Auth State
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastLoginAttempt: Date | null;
}

// Clients State
export interface ClientsState {
  clients: Client[];
  selectedClient: Client | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filters: {
    status: 'all' | 'active' | 'inactive';
    hasActiveLoans?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Loans State
export interface LoansState {
  loans: Loan[];
  selectedLoan: Loan | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filters: {
    status: 'all' | 'ATIVO' | 'QUITADO' | 'INADIMPLENTE';
    source: 'all' | 'INVESTIMENTO' | 'CAIXA';
    minAmount?: number;
    maxAmount?: number;
    startDateAfter?: Date;
    startDateBefore?: Date;
    clientId?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Payments State
export interface PaymentsState {
  payments: Payment[];
  monthlyPayments: MonthlyPayment[];
  selectedPayment: Payment | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filters: {
    paymentType: 'all' | 'JUROS' | 'JUROS_PRINCIPAL';
    dateAfter?: Date;
    dateBefore?: Date;
    minAmount?: number;
    maxAmount?: number;
    clientId?: string;
    loanId?: string;
  };
  monthlyControl: MonthlyControl | null;
  currentMonth: number;
  currentYear: number;
}

// Summary State
export interface SummaryState {
  summaryData: SummaryData | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    startMonth?: string;
    startYear?: number;
    endMonth?: string;
    endYear?: number;
    showOnlyPositive: boolean;
    groupBy: 'month' | 'quarter' | 'year';
  };
  selectedPeriod: {
    month: string;
    year: number;
  } | null;
}

// Sync State
export interface SyncState {
  isOnline: boolean;
  lastSyncDate: Date | null;
  isSyncing: boolean;
  syncError: string | null;
  pendingChanges: {
    clients: string[]; // IDs of clients with pending changes
    loans: string[]; // IDs of loans with pending changes
    payments: string[]; // IDs of payments with pending changes
  };
  conflictResolution: {
    hasConflicts: boolean;
    conflicts: SyncConflict[];
  };
}

// Sync Conflict Type
export interface SyncConflict {
  id: string;
  type: 'client' | 'loan' | 'payment';
  localData: any;
  remoteData: any;
  conflictFields: string[];
  timestamp: Date;
}

// UI State
export interface UIState {
  theme: 'light' | 'dark';
  language: 'pt' | 'en';
  notifications: {
    enabled: boolean;
    paymentReminders: boolean;
    overdueAlerts: boolean;
    syncAlerts: boolean;
  };
  navigation: {
    currentTab: string;
    previousScreen: string | null;
  };
  modals: {
    newClient: boolean;
    newLoan: boolean;
    paymentRegistration: boolean;
    conflictResolution: boolean;
  };
  loading: {
    global: boolean;
    screens: Record<string, boolean>;
  };
}

// Root State
export interface RootState {
  auth: AuthState;
  clients: ClientsState;
  loans: LoansState;
  payments: PaymentsState;
  summary: SummaryState;
  sync: SyncState;
  ui: UIState;
}

// Action Types
export interface BaseAction {
  type: string;
  payload?: any;
  meta?: {
    timestamp: Date;
    userId?: string;
    offline?: boolean;
  };
}

// Async Action States
export interface AsyncActionState<T = any> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: Date | null;
}

// Pagination State
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  isLoadingMore: boolean;
}

// Search State
export interface SearchState {
  query: string;
  results: any[];
  isSearching: boolean;
  searchError: string | null;
  recentSearches: string[];
}

// Filter State
export interface FilterState<T = any> {
  activeFilters: T;
  availableFilters: Record<string, any[]>;
  isFiltering: boolean;
}

// Form State
export interface FormState<T = any> {
  data: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Cache State
export interface CacheState<T = any> {
  data: Record<string, T>;
  timestamps: Record<string, Date>;
  ttl: number; // Time to live in milliseconds
}

// Offline State
export interface OfflineState {
  isOffline: boolean;
  queuedActions: BaseAction[];
  failedActions: BaseAction[];
  retryCount: Record<string, number>;
}