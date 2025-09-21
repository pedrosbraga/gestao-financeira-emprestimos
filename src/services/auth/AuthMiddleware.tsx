import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { initializeAuth, selectAuth } from '../../store/slices/authSlice';
import { AppDispatch } from '../../store';
import LoginScreen from '../../screens/auth/LoginScreen';
import AuthService, { UserType } from './AuthService';

interface AuthMiddlewareProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredUserTypes?: UserType[];
}

/**
 * AuthMiddleware component that handles authentication state and route protection
 */
const AuthMiddleware: React.FC<AuthMiddlewareProps> = ({ 
  children, 
  requiredPermissions = [],
  requiredUserTypes = []
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading, isInitialized, user } = useSelector(selectAuth);

  useEffect(() => {
    if (!isInitialized) {
      dispatch(initializeAuth());
    }
  }, [dispatch, isInitialized]);

  // Show loading screen while initializing
  if (isLoading || !isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D632" />
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated || !user) {
    return <LoginScreen />;
  }

  // Check user type permissions
  if (requiredUserTypes.length > 0 && !requiredUserTypes.includes(user.userType)) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Acesso negado. Você não tem permissão para acessar esta funcionalidade.
        </Text>
      </View>
    );
  }

  // Check specific permissions
  if (requiredPermissions.length > 0) {
    const authService = AuthService.getInstance();
    const hasAllPermissions = requiredPermissions.every(permission => 
      authService.hasPermission(user.userType, permission)
    );

    if (!hasAllPermissions) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Acesso negado. Você não tem as permissões necessárias.
          </Text>
        </View>
      );
    }
  }

  // User is authenticated and has required permissions
  return <>{children}</>;
};

/**
 * Hook for checking permissions in components
 */
export const useAuth = () => {
  const auth = useSelector(selectAuth);
  const authService = AuthService.getInstance();

  const hasPermission = (permission: string): boolean => {
    if (!auth.user) return false;
    return authService.hasPermission(auth.user.userType, permission);
  };

  const hasUserType = (userType: UserType): boolean => {
    return auth.user?.userType === userType;
  };

  const hasAnyUserType = (userTypes: UserType[]): boolean => {
    if (!auth.user) return false;
    return userTypes.includes(auth.user.userType);
  };

  const isCEO = (): boolean => {
    return auth.user?.userType === 'CEO';
  };

  const isCEOOrManager = (): boolean => {
    return auth.user?.userType === 'CEO' || auth.user?.userType === 'GERENTE';
  };

  const hasFinancialAccess = (): boolean => {
    return ['CEO', 'GERENTE', 'FINANCEIRO'].includes(auth.user?.userType || '');
  };

  return {
    ...auth,
    hasPermission,
    hasUserType,
    hasAnyUserType,
    isCEO,
    isCEOOrManager,
    hasFinancialAccess,
  };
};

/**
 * Higher-order component for protecting routes
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredPermissions?: string[];
    requiredUserTypes?: UserType[];
  }
) => {
  return (props: P) => (
    <AuthMiddleware 
      requiredPermissions={options?.requiredPermissions}
      requiredUserTypes={options?.requiredUserTypes}
    >
      <Component {...props} />
    </AuthMiddleware>
  );
};

/**
 * Component for protecting specific UI elements based on permissions
 */
export const ProtectedComponent: React.FC<{
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredUserTypes?: UserType[];
  fallback?: React.ReactNode;
}> = ({ children, requiredPermissions = [], requiredUserTypes = [], fallback = null }) => {
  const { user } = useSelector(selectAuth);
  const authService = AuthService.getInstance();

  if (!user) {
    return <>{fallback}</>;
  }

  // Check user type permissions
  if (requiredUserTypes.length > 0 && !requiredUserTypes.includes(user.userType)) {
    return <>{fallback}</>;
  }

  // Check specific permissions
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      authService.hasPermission(user.userType, permission)
    );

    if (!hasAllPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default AuthMiddleware;