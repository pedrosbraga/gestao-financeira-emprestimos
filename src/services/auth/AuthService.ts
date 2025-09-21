import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config/env';

export type UserType = 'CEO' | 'GERENTE' | 'FINANCEIRO';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: AppUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

class AuthService {
  private supabase: SupabaseClient;
  private static instance: AuthService;

  private constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Get the Supabase client instance
   */
  public getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Sign in with email and password
   */
  public async signIn(credentials: LoginCredentials): Promise<{ user: AppUser | null; error: AuthError | null }> {
    console.log('🔐 AuthService: Iniciando login para:', credentials.email);
    
    try {
      console.log('📡 AuthService: Fazendo requisição para Supabase Auth...');
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      console.log('📡 AuthService: Resposta do Supabase Auth:', { 
        hasUser: !!data?.user, 
        hasError: !!error,
        errorMessage: error?.message,
        errorCode: error?.status
      });

      if (error) {
        console.error('❌ AuthService: Erro do Supabase Auth:', {
          message: error.message,
          status: error.status,
          code: error.code || 'unknown'
        });
        return { 
          user: null, 
          error: { 
            message: `Erro de autenticação: ${error.message}`, 
            code: error.status?.toString() || 'auth_error' 
          } 
        };
      }

      if (!data.user) {
        console.error('❌ AuthService: Usuário não retornado pelo Supabase');
        return { user: null, error: { message: 'Usuário não encontrado' } };
      }

      console.log('✅ AuthService: Login no Supabase bem-sucedido, ID:', data.user.id);

      // Get user profile from our users table
      console.log('👤 AuthService: Buscando perfil do usuário...');
      const appUser = await this.getUserProfile(data.user.id);
      
      if (!appUser) {
        console.error('❌ AuthService: Perfil não encontrado na tabela public.users');
        return { user: null, error: { message: 'Perfil de usuário não encontrado na base de dados' } };
      }

      console.log('✅ AuthService: Perfil encontrado:', {
        name: appUser.name,
        email: appUser.email,
        userType: appUser.userType
      });

      // Update last login
      console.log('🕒 AuthService: Atualizando último login...');
      await this.updateLastLogin(data.user.id);

      console.log('🎉 AuthService: Login completo com sucesso!');
      return { user: appUser, error: null };
    } catch (error) {
      console.error('💥 AuthService: Erro geral no login:', error);
      return { 
        user: null, 
        error: { 
          message: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          code: 'internal_error'
        } 
      };
    }
  }

  /**
   * Sign out current user
   */
  public async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        return { error: { message: error.message, code: error.message } };
      }

      return { error: null };
    } catch (error) {
      return { 
        error: { message: error instanceof Error ? error.message : 'Erro ao fazer logout' } 
      };
    }
  }

  /**
   * Get current session
   */
  public async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  public async getCurrentUser(): Promise<AppUser | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      return await this.getUserProfile(user.id);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get user profile from our users table
   */
  private async getUserProfile(userId: string): Promise<AppUser | null> {
    console.log('👤 AuthService: Buscando perfil para ID:', userId);
    
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('id, name, email, user_type, created_at, last_login')
        .eq('id', userId)
        .single();

      console.log('📊 AuthService: Resposta da consulta de perfil:', {
        hasData: !!data,
        hasError: !!error,
        errorMessage: error?.message,
        errorCode: error?.code
      });

      if (error) {
        console.error('❌ AuthService: Erro ao buscar perfil:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return null;
      }

      if (!data) {
        console.error('❌ AuthService: Nenhum dado retornado para o usuário');
        return null;
      }

      console.log('✅ AuthService: Perfil encontrado:', {
        id: data.id,
        name: data.name,
        email: data.email,
        userType: data.user_type
      });

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        userType: data.user_type,
        createdAt: data.created_at,
        lastLogin: data.last_login,
      };
    } catch (error) {
      console.error('💥 AuthService: Erro geral em getUserProfile:', error);
      return null;
    }
  }

  /**
   * Update user's last login timestamp
   */
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Check if user has permission for a specific action
   */
  public hasPermission(userType: UserType, action: string): boolean {
    const permissions = {
      CEO: [
        'read_all',
        'write_all',
        'delete_all',
        'manage_users',
        'view_reports',
        'manage_clients',
        'manage_loans',
        'manage_payments',
      ],
      GERENTE: [
        'read_all',
        'write_all',
        'view_reports',
        'manage_clients',
        'manage_loans',
        'manage_payments',
      ],
      FINANCEIRO: [
        'read_payments',
        'manage_payments',
        'view_monthly_control',
      ],
    };

    return permissions[userType]?.includes(action) || false;
  }

  /**
   * Set up auth state change listener
   */
  public onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Refresh current session
   */
  public async refreshSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();
      
      if (error) {
        return { session: null, error: { message: error.message, code: error.message } };
      }

      return { session: data.session, error: null };
    } catch (error) {
      return { 
        session: null, 
        error: { message: error instanceof Error ? error.message : 'Erro ao renovar sessão' } 
      };
    }
  }

  /**
   * Check if current user is CEO
   */
  public async isCEO(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.userType === 'CEO';
  }

  /**
   * Check if current user is CEO or Manager
   */
  public async isCEOOrManager(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.userType === 'CEO' || user?.userType === 'GERENTE';
  }

  /**
   * Check if current user has financial access
   */
  public async hasFinancialAccess(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return ['CEO', 'GERENTE', 'FINANCEIRO'].includes(user?.userType || '');
  }
}

export default AuthService;