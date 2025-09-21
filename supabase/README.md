# Supabase Setup Guide

This guide will help you set up the Supabase project for the Gestão Financeira de Empréstimos application.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Install Supabase CLI (optional but recommended)

## Setup Steps

### 1. Create New Project

1. Go to your Supabase dashboard
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `gestao-financeira-emprestimos`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users

### 2. Configure Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Run the following files in order:

#### Step 2.1: Create Schema
```sql
-- Copy and paste the contents of schema.sql
```

#### Step 2.2: Configure RLS Policies
```sql
-- Copy and paste the contents of rls-policies.sql
```

#### Step 2.3: Add Seed Data (Optional)
```sql
-- Copy and paste the contents of seed.sql
```

### 3. Configure Authentication

1. Go to Authentication > Settings
2. Configure the following settings:

#### Site URL
- Set to your app's URL (for development: `http://localhost:3000`)

#### Auth Providers
- Enable Email authentication
- Configure any additional providers as needed

#### Email Templates
- Customize confirmation and recovery email templates

### 4. Get Project Credentials

1. Go to Settings > API
2. Copy the following values:
   - Project URL
   - Project API Key (anon/public)
   - Service Role Key (keep this secret)

### 5. Environment Configuration

Create a `.env` file in your React Native project with:

```env
SUPABASE_URL=your_project_url_here
SUPABASE_ANON_KEY=your_anon_key_here
```

## Database Schema Overview

### Tables Created

1. **users** - Extends Supabase auth.users with app-specific data
2. **clients** - Customer information
3. **loans** - Loan records with amounts, rates, and status
4. **payments** - Payment history for loans
5. **monthly_payments** - Expected monthly payments tracking
6. **audit_log** - Audit trail for all changes

### User Types and Permissions

- **CEO**: Full access to all features
- **GERENTE**: All features except user management and deletions
- **FINANCEIRO**: Only payment recording and viewing

### Automatic Features

- **Triggers**: Automatically update loan balances, generate monthly payments
- **RLS Policies**: Row-level security based on user types
- **Audit Logging**: All changes are automatically logged
- **Timestamps**: Automatic created_at and updated_at fields

## Testing the Setup

### 1. Create Test Users

1. Go to Authentication > Users
2. Create users with different roles:
   - CEO user: `ceo@test.com`
   - Manager user: `gerente@test.com`
   - Finance user: `financeiro@test.com`

### 2. Add User Records

For each created auth user, run:

```sql
INSERT INTO public.users (id, name, email, user_type) VALUES
('auth_user_id_here', 'User Name', 'user@email.com', 'CEO');
```

### 3. Test Sample Data

Run the sample data function:

```sql
SELECT create_sample_data('ceo_user_id_here');
```

## Security Considerations

1. **RLS Enabled**: All tables have Row Level Security enabled
2. **User-based Access**: Policies enforce user type restrictions
3. **Audit Trail**: All changes are logged with user information
4. **Secure Functions**: Helper functions use SECURITY DEFINER

## Backup and Maintenance

1. **Automatic Backups**: Supabase provides automatic daily backups
2. **Point-in-time Recovery**: Available for Pro plans
3. **Manual Backups**: Can be created through dashboard

## Troubleshooting

### Common Issues

1. **RLS Blocking Queries**: Ensure user has proper permissions
2. **Trigger Errors**: Check function definitions and permissions
3. **Auth Issues**: Verify user exists in both auth.users and public.users

### Useful Queries

```sql
-- Check user permissions
SELECT * FROM public.users WHERE id = auth.uid();

-- View RLS policies
SELECT * FROM pg_policies WHERE tablename = 'loans';

-- Check audit log
SELECT * FROM public.audit_log ORDER BY created_at DESC LIMIT 10;
```

## Next Steps

After completing this setup:

1. Configure the React Native app with Supabase credentials
2. Implement authentication service
3. Test database connections
4. Deploy to production environment