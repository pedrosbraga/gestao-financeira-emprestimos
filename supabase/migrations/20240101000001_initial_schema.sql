-- Initial schema for Gestão Financeira de Empréstimos
-- This migration creates all tables, types, functions, and triggers

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure uuid_generate_v4 function is available
CREATE OR REPLACE FUNCTION uuid_generate_v4()
RETURNS uuid AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

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
    client_references JSONB,
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
);

-- Create indexes for better performance
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