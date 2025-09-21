import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Session } from '@supabase/supabase-js';
import AuthService, { AppUser, LoginCredentials, AuthError } from '../../services/auth/AuthService';

export interface AuthState {
  user: AppUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
};

// Async thunks
export const signIn = createAsyncThunk(
  'auth/signIn',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    console.log('🔄 Redux: Iniciando ação de login para:', credentials.email);
    
    const authService = AuthService.getInstance();
    const result = await authService.signIn(credentials);
    
    console.log('🔄 Redux: Resultado do AuthService:', {
      hasUser: !!result.user,
      hasError: !!result.error,
      errorMessage: result.error?.message
    });
    
    if (result.error) {
      console.error('❌ Redux: Rejeitando com erro:', result.error.message);
      return rejectWithValue(result.error.message);
    }
    
    console.log('✅ Redux: Login bem-sucedido, buscando sessão...');
    const session = await authService.getCurrentSession();
    
    console.log('✅ Redux: Retornando dados completos:', {
      userName: result.user?.name,
      userType: result.user?.userType,
      hasSession: !!session
    });
    
    return { user: result.user, session };
  }
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    const authService = AuthService.getInstance();
    const result = await authService.signOut();
    
    if (result.error) {
      return rejectWithValue(result.error.message);
    }
    
    return null;
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const authService = AuthService.getInstance();
      const session = await authService.getCurrentSession();
      
      if (session) {
        const user = await authService.getCurrentUser();
        return { user, session };
      }
      
      return { user: null, session: null };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erro na inicialização');
    }
  }
);

export const refreshSession = createAsyncThunk(
  'auth/refreshSession',
  async (_, { rejectWithValue }) => {
    const authService = AuthService.getInstance();
    const result = await authService.refreshSession();
    
    if (result.error) {
      return rejectWithValue(result.error.message);
    }
    
    const user = await authService.getCurrentUser();
    return { user, session: result.session };
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setSession: (state, action: PayloadAction<{ user: AppUser | null; session: Session | null }>) => {
      state.user = action.payload.user;
      state.session = action.payload.session;
      state.isAuthenticated = !!action.payload.user && !!action.payload.session;
    },
    clearAuth: (state) => {
      state.user = null;
      state.session = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Sign In
    builder
      .addCase(signIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });

    // Sign Out
    builder
      .addCase(signOut.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Initialize Auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.isInitialized = false;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isAuthenticated = !!action.payload.user && !!action.payload.session;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.error = action.payload as string;
      });

    // Refresh Session
    builder
      .addCase(refreshSession.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isAuthenticated = !!action.payload.user && !!action.payload.session;
      })
      .addCase(refreshSession.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setLoading, clearError, setSession, clearAuth } = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.isInitialized;

export default authSlice.reducer;