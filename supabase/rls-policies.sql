-- Row Level Security Policies
-- This file contains all RLS policies for user access control

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user type
CREATE OR REPLACE FUNCTION get_user_type()
RETURNS user_type AS $$
BEGIN
    RETURN (
        SELECT user_type 
        FROM public.users 
        WHERE id = auth.uid()
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Helper function to check if user is CEO
CREATE OR REPLACE FUNCTION is_ceo()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_type() = 'CEO';
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Helper function to check if user is CEO or GERENTE
CREATE OR REPLACE FUNCTION is_ceo_or_manager()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_type() IN ('CEO', 'GERENTE');
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Helper function to check if user has financial access
CREATE OR REPLACE FUNCTION has_financial_access()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_type() IN ('CEO', 'GERENTE', 'FINANCEIRO');
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- USERS table policies
-- Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- CEO can read all users
CREATE POLICY "CEO can read all users" ON public.users
    FOR SELECT USING (is_ceo());

-- CEO can insert/update users
CREATE POLICY "CEO can manage users" ON public.users
    FOR ALL USING (is_ceo());

-- Users can update their own last_login
CREATE POLICY "Users can update own last_login" ON public.users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- CLIENTS table policies
-- CEO and GERENTE can read all clients
CREATE POLICY "CEO and Manager can read clients" ON public.clients
    FOR SELECT USING (is_ceo_or_manager());

-- CEO and GERENTE can insert clients
CREATE POLICY "CEO and Manager can insert clients" ON public.clients
    FOR INSERT WITH CHECK (is_ceo_or_manager());

-- CEO and GERENTE can update clients
CREATE POLICY "CEO and Manager can update clients" ON public.clients
    FOR UPDATE USING (is_ceo_or_manager())
    WITH CHECK (is_ceo_or_manager());

-- Only CEO can delete clients
CREATE POLICY "Only CEO can delete clients" ON public.clients
    FOR DELETE USING (is_ceo());

-- LOANS table policies
-- CEO and GERENTE can read all loans
CREATE POLICY "CEO and Manager can read loans" ON public.loans
    FOR SELECT USING (is_ceo_or_manager());

-- CEO and GERENTE can insert loans
CREATE POLICY "CEO and Manager can insert loans" ON public.loans
    FOR INSERT WITH CHECK (is_ceo_or_manager());

-- CEO and GERENTE can update loans
CREATE POLICY "CEO and Manager can update loans" ON public.loans
    FOR UPDATE USING (is_ceo_or_manager())
    WITH CHECK (is_ceo_or_manager());

-- Only CEO can delete loans
CREATE POLICY "Only CEO can delete loans" ON public.loans
    FOR DELETE USING (is_ceo());

-- PAYMENTS table policies
-- All authenticated users can read payments (for their work)
CREATE POLICY "All users can read payments" ON public.payments
    FOR SELECT USING (has_financial_access());

-- All authenticated users can insert payments
CREATE POLICY "All users can insert payments" ON public.payments
    FOR INSERT WITH CHECK (has_financial_access());

-- CEO and GERENTE can update payments
CREATE POLICY "CEO and Manager can update payments" ON public.payments
    FOR UPDATE USING (is_ceo_or_manager())
    WITH CHECK (is_ceo_or_manager());

-- Only CEO can delete payments
CREATE POLICY "Only CEO can delete payments" ON public.payments
    FOR DELETE USING (is_ceo());

-- MONTHLY_PAYMENTS table policies
-- All authenticated users can read monthly payments
CREATE POLICY "All users can read monthly payments" ON public.monthly_payments
    FOR SELECT USING (has_financial_access());

-- All authenticated users can update monthly payments (to mark as paid)
CREATE POLICY "All users can update monthly payments" ON public.monthly_payments
    FOR UPDATE USING (has_financial_access())
    WITH CHECK (has_financial_access());

-- System can insert monthly payments (via triggers)
CREATE POLICY "System can insert monthly payments" ON public.monthly_payments
    FOR INSERT WITH CHECK (true);

-- Only CEO can delete monthly payments
CREATE POLICY "Only CEO can delete monthly payments" ON public.monthly_payments
    FOR DELETE USING (is_ceo());

-- AUDIT_LOG table policies
-- CEO can read all audit logs
CREATE POLICY "CEO can read audit logs" ON public.audit_log
    FOR SELECT USING (is_ceo());

-- System can insert audit logs (via triggers)
CREATE POLICY "System can insert audit logs" ON public.audit_log
    FOR INSERT WITH CHECK (true);

-- No one can update or delete audit logs (immutable)
-- (No policies needed as default is to deny)