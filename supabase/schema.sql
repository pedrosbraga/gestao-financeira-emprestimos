-- Gestão Financeira de Empréstimos - Database Schema
-- This file contains the complete database schema for the loan management system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_type AS ENUM ('CEO', 'GERENTE', 'FINANCEIRO');
CREATE TYPE loan_source AS ENUM ('INVESTIMENTO', 'CAIXA');
CREATE TYPE loan_status AS ENUM ('ATIVO', 'QUITADO', 'INADIMPLENTE');
CREATE TYPE payment_type AS ENUM ('JUROS', 'JUROS_PRINCIPAL');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    user_type user_type NOT NULL DEFAULT 'FINANCEIRO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Clients table
CREATE TABLE public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    document TEXT,
    phone TEXT,
    address JSONB,
    references JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Loans table
CREATE TABLE public.loans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    interest_rate DECIMAL(5,4) NOT NULL CHECK (interest_rate >= 0),
    start_date DATE NOT NULL,
    source loan_source NOT NULL,
    status loan_status NOT NULL DEFAULT 'ATIVO',
    remaining_balance DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) NOT NULL
);

-- Payments table
CREATE TABLE public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    loan_id UUID REFERENCES public.loans(id) ON DELETE CASCADE NOT NULL,
    payment_date DATE NOT NULL,
    interest_amount DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (interest_amount >= 0),
    principal_amount DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (principal_amount >= 0),
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (interest_amount + principal_amount) STORED,
    payment_type payment_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    received_by UUID REFERENCES public.users(id) NOT NULL
);

-- Monthly payments table (for tracking expected monthly payments)
CREATE TABLE public.monthly_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    loan_id UUID REFERENCES public.loans(id) ON DELETE CASCADE NOT NULL,
    due_date DATE NOT NULL,
    interest_amount DECIMAL(15,2) NOT NULL CHECK (interest_amount >= 0),
    principal_amount DECIMAL(15,2) DEFAULT 0 CHECK (principal_amount >= 0),
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    paid_date TIMESTAMP WITH TIME ZONE,
    payment_id UUID REFERENCES public.payments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    received_by UUID REFERENCES public.users(id)
);

-- Audit log table for tracking all changes
CREATE TABLE public.audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);-- Cre
ate indexes for better performance
CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_clients_document ON public.clients(document);
CREATE INDEX idx_loans_client_id ON public.loans(client_id);
CREATE INDEX idx_loans_status ON public.loans(status);
CREATE INDEX idx_loans_start_date ON public.loans(start_date);
CREATE INDEX idx_payments_loan_id ON public.payments(loan_id);
CREATE INDEX idx_payments_date ON public.payments(payment_date);
CREATE INDEX idx_monthly_payments_loan_id ON public.monthly_payments(loan_id);
CREATE INDEX idx_monthly_payments_due_date ON public.monthly_payments(due_date);
CREATE INDEX idx_monthly_payments_is_paid ON public.monthly_payments(is_paid);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_payments_updated_at BEFORE UPDATE ON public.monthly_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate remaining balance after payment
CREATE OR REPLACE FUNCTION update_loan_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update remaining balance when a payment is made
    IF TG_OP = 'INSERT' THEN
        UPDATE public.loans 
        SET remaining_balance = remaining_balance - NEW.principal_amount
        WHERE id = NEW.loan_id;
        
        -- Update loan status if fully paid
        UPDATE public.loans 
        SET status = 'QUITADO'
        WHERE id = NEW.loan_id AND remaining_balance <= 0;
        
        RETURN NEW;
    END IF;
    
    -- Handle payment updates
    IF TG_OP = 'UPDATE' THEN
        UPDATE public.loans 
        SET remaining_balance = remaining_balance + OLD.principal_amount - NEW.principal_amount
        WHERE id = NEW.loan_id;
        
        -- Update loan status
        UPDATE public.loans 
        SET status = CASE 
            WHEN remaining_balance <= 0 THEN 'QUITADO'
            ELSE 'ATIVO'
        END
        WHERE id = NEW.loan_id;
        
        RETURN NEW;
    END IF;
    
    -- Handle payment deletion
    IF TG_OP = 'DELETE' THEN
        UPDATE public.loans 
        SET remaining_balance = remaining_balance + OLD.principal_amount,
            status = 'ATIVO'
        WHERE id = OLD.loan_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply balance update trigger
CREATE TRIGGER update_loan_balance_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_loan_balance();

-- Function to generate monthly payments when loan is created
CREATE OR REPLACE FUNCTION generate_monthly_payments()
RETURNS TRIGGER AS $$
DECLARE
    monthly_interest DECIMAL(15,2);
    current_date DATE;
    months_count INTEGER := 12; -- Generate 12 months ahead
BEGIN
    -- Calculate monthly interest
    monthly_interest := (NEW.amount * NEW.interest_rate / 100) / 12;
    current_date := NEW.start_date;
    
    -- Generate monthly payment records
    FOR i IN 1..months_count LOOP
        INSERT INTO public.monthly_payments (
            loan_id,
            due_date,
            interest_amount
        ) VALUES (
            NEW.id,
            current_date + INTERVAL '1 month' * i,
            monthly_interest
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply monthly payments generation trigger
CREATE TRIGGER generate_monthly_payments_trigger
    AFTER INSERT ON public.loans
    FOR EACH ROW EXECUTE FUNCTION generate_monthly_payments();

-- Function to mark monthly payment as paid
CREATE OR REPLACE FUNCTION mark_monthly_payment_paid()
RETURNS TRIGGER AS $$
BEGIN
    -- When a payment is made, mark corresponding monthly payment as paid
    UPDATE public.monthly_payments 
    SET 
        is_paid = TRUE,
        paid_date = NEW.created_at,
        payment_id = NEW.id,
        received_by = NEW.received_by,
        principal_amount = NEW.principal_amount
    WHERE 
        loan_id = NEW.loan_id 
        AND DATE_TRUNC('month', due_date) = DATE_TRUNC('month', NEW.payment_date)
        AND NOT is_paid;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply monthly payment marking trigger
CREATE TRIGGER mark_monthly_payment_paid_trigger
    AFTER INSERT ON public.payments
    FOR EACH ROW EXECUTE FUNCTION mark_monthly_payment_paid();

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_log (table_name, record_id, action, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_log (table_name, record_id, action, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_log (table_name, record_id, action, old_values, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply audit triggers to all main tables
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_clients_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_loans_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.loans
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_payments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();