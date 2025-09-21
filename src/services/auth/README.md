# Authentication System

This directory contains the complete authentication system for the Gestão Financeira de Empréstimos application.

## Overview

The authentication system is built using Supabase Auth and provides:

- User authentication with email/password
- Role-based access control (CEO, GERENTE, FINANCEIRO)
- Session management with automatic refresh
- Permission-based UI protection
- Offline-capable authentication state

## Architecture

### Components

1. **AuthService** - Core authentication service (Singleton)
2. **AuthSlice** - Redux state management for auth
3. **AuthMiddleware** - Route protection and initialization
4. **LoginScreen** - User login interface

### User Types and Permissions

#### CEO
- Full access to all features
- Can manage users
- Can delete records
- All read/write permissions

#### GERENTE (Manager)
- All features except user management and deletions
- Can manage clients, loans, and payments
- Can view all reports

#### FINANCEIRO (Finance)
- Limited to payment-related functions
- Can record and view payments
- Can access monthly payment control

## Usage

### Basic Authentication

```typescript
import AuthService from './services/auth/AuthService';

const authService = AuthService.getInstance();

// Sign in
const result = await authService.signIn({
  email: 'user@example.com',
  password: 'password123'
});

if (result.error) {
  console.error('Login failed:', result.error.message);
} else {
  console.log('User logged in:', result.user);
}

// Sign out
await authService.signOut();
```

### Using Redux Actions

```typescript
import { useDispatch, useSelector } from 'react-redux';
import { signIn, signOut, selectAuth } from './store/slices/authSlice';

const LoginComponent = () => {
  const dispatch = useDispatch();
  const { isLoading, error, isAuthenticated } = useSelector(selectAuth);

  const handleLogin = () => {
    dispatch(signIn({ email, password }));
  };

  const handleLogout = () => {
    dispatch(signOut());
  };
};
```

### Route Protection

```typescript
import AuthMiddleware from './services/auth/AuthMiddleware';

// Protect entire app
const App = () => (
  <AuthMiddleware>
    <MainApp />
  </AuthMiddleware>
);

// Protect specific routes with permissions
const AdminPanel = () => (
  <AuthMiddleware requiredUserTypes={['CEO']}>
    <AdminContent />
  </AuthMiddleware>
);

// Protect with specific permissions
const ReportsScreen = () => (
  <AuthMiddleware requiredPermissions={['view_reports']}>
    <Reports />
  </AuthMiddleware>
);
```

### Using Auth Hook

```typescript
import { useAuth } from './services/auth/AuthMiddleware';

const MyComponent = () => {
  const { user, isAuthenticated, isCEO, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return (
    <View>
      <Text>Welcome, {user?.name}</Text>
      
      {isCEO() && (
        <AdminButton />
      )}
      
      {hasPermission('manage_payments') && (
        <PaymentControls />
      )}
    </View>
  );
};
```

### Protecting UI Components

```typescript
import { ProtectedComponent } from './services/auth/AuthMiddleware';

const MyScreen = () => (
  <View>
    <Text>Public content</Text>
    
    <ProtectedComponent requiredUserTypes={['CEO', 'GERENTE']}>
      <ManagementControls />
    </ProtectedComponent>
    
    <ProtectedComponent 
      requiredPermissions={['delete_all']}
      fallback={<Text>No permission</Text>}
    >
      <DeleteButton />
    </ProtectedComponent>
  </View>
);
```

## Permission System

### Available Permissions

- `read_all` - Read all data
- `write_all` - Write/update data
- `delete_all` - Delete records
- `manage_users` - User management
- `view_reports` - Access reports
- `manage_clients` - Client management
- `manage_loans` - Loan management
- `manage_payments` - Payment management
- `read_payments` - Read payment data
- `view_monthly_control` - Monthly control access

### Permission Matrix

| Permission | CEO | GERENTE | FINANCEIRO |
|------------|-----|---------|------------|
| read_all | ✅ | ✅ | ❌ |
| write_all | ✅ | ✅ | ❌ |
| delete_all | ✅ | ❌ | ❌ |
| manage_users | ✅ | ❌ | ❌ |
| view_reports | ✅ | ✅ | ❌ |
| manage_clients | ✅ | ✅ | ❌ |
| manage_loans | ✅ | ✅ | ❌ |
| manage_payments | ✅ | ✅ | ✅ |
| read_payments | ✅ | ✅ | ✅ |
| view_monthly_control | ✅ | ✅ | ✅ |

## Error Handling

The authentication system provides comprehensive error handling:

```typescript
// Service level errors
const result = await authService.signIn(credentials);
if (result.error) {
  switch (result.error.code) {
    case 'invalid_credentials':
      // Handle invalid login
      break;
    case 'user_not_found':
      // Handle missing user profile
      break;
    default:
      // Handle generic error
  }
}

// Redux level errors
const { error } = useSelector(selectAuth);
if (error) {
  // Display error to user
  Alert.alert('Authentication Error', error);
}
```

## Session Management

### Automatic Session Refresh

Sessions are automatically refreshed when they expire:

```typescript
// Manual refresh if needed
const result = await authService.refreshSession();
if (result.error) {
  // Handle refresh failure - likely need to re-login
}
```

### Session Persistence

Sessions are persisted using AsyncStorage and automatically restored on app restart.

## Testing

### Running Tests

```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
```

### Test Structure

```
src/services/auth/__tests__/
├── AuthService.test.ts     # Service unit tests
├── AuthSlice.test.ts       # Redux slice tests
└── AuthMiddleware.test.tsx # Component tests
```

### Example Test

```typescript
import AuthService from '../AuthService';

describe('AuthService', () => {
  it('should sign in with valid credentials', async () => {
    const result = await authService.signIn({
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(result.user).toBeDefined();
    expect(result.error).toBeNull();
  });
});
```

## Security Considerations

1. **Password Security**: Passwords are handled by Supabase Auth
2. **Token Storage**: JWT tokens are securely stored in AsyncStorage
3. **Session Validation**: Sessions are validated on each request
4. **Permission Checks**: All permissions are verified server-side via RLS
5. **Audit Trail**: All authentication events are logged

## Troubleshooting

### Common Issues

1. **"User profile not found"**
   - Ensure user exists in both `auth.users` and `public.users` tables
   - Check RLS policies allow user to read their own profile

2. **Permission denied errors**
   - Verify user type is correctly set in database
   - Check RLS policies are properly configured

3. **Session not persisting**
   - Verify AsyncStorage is properly configured
   - Check if app has storage permissions

### Debug Mode

Enable debug logging:

```typescript
// In development
if (__DEV__) {
  console.log('Auth state:', authService.getCurrentUser());
}
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. Ensure Supabase database is set up with proper schema and RLS policies

## Next Steps

After implementing authentication:

1. Set up user creation flow for admins
2. Implement password reset functionality
3. Add biometric authentication (optional)
4. Set up push notifications for security events
5. Implement audit logging for authentication events