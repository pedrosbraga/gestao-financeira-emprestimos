-- Seed data for development and testing
-- This migration contains initial data for the loan management system

-- Sample clients for testing
INSERT INTO public.clients (id, name, document, phone, address, client_references) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    'João Silva Santos',
    '123.456.789-00',
    '(11) 99999-1234',
    '{"street": "Rua das Flores", "number": "123", "city": "São Paulo", "state": "SP", "zipCode": "01234-567"}',
    '[{"name": "Maria Silva", "phone": "(11) 88888-1234", "relationship": "Esposa"}]'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Ana Paula Costa',
    '987.654.321-00',
    '(11) 99999-5678',
    '{"street": "Av. Paulista", "number": "456", "city": "São Paulo", "state": "SP", "zipCode": "01310-100"}',
    '[{"name": "Carlos Costa", "phone": "(11) 88888-5678", "relationship": "Marido"}]'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Pedro Oliveira Lima',
    '456.789.123-00',
    '(11) 99999-9012',
    '{"street": "Rua Augusta", "number": "789", "city": "São Paulo", "state": "SP", "zipCode": "01305-000"}',
    '[{"name": "Lucia Oliveira", "phone": "(11) 88888-9012", "relationship": "Mãe"}]'
);

-- Function to create sample data after authentication setup
CREATE OR REPLACE FUNCTION create_sample_data(ceo_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Insert sample loans
    INSERT INTO public.loans (id, client_id, amount, interest_rate, start_date, source, remaining_balance, created_by) VALUES
    (
        '660e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440001',
        5000.00,
        1.0000,
        '2024-01-15',
        'CAIXA',
        5000.00,
        ceo_user_id
    ),
    (
        '660e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440002',
        10000.00,
        1.2000,
        '2024-02-01',
        'INVESTIMENTO',
        8500.00,
        ceo_user_id
    ),
    (
        '660e8400-e29b-41d4-a716-446655440003',
        '550e8400-e29b-41d4-a716-446655440003',
        3000.00,
        0.8000,
        '2024-03-10',
        'CAIXA',
        3000.00,
        ceo_user_id
    );

    -- Insert sample payments
    INSERT INTO public.payments (loan_id, payment_date, interest_amount, principal_amount, payment_type, received_by) VALUES
    (
        '660e8400-e29b-41d4-a716-446655440002',
        '2024-03-01',
        100.00,
        1500.00,
        'JUROS_PRINCIPAL',
        ceo_user_id
    ),
    (
        '660e8400-e29b-41d4-a716-446655440001',
        '2024-02-15',
        41.67,
        0.00,
        'JUROS',
        ceo_user_id
    );
END;
$$ language 'plpgsql';

-- Instructions for setup:
-- 1. Create users through Supabase Auth
-- 2. Insert user records in public.users table
-- 3. Run: SELECT create_sample_data('your-ceo-user-id-here');

-- Example of how to insert a user after auth.users is created:
-- INSERT INTO public.users (id, name, email, user_type) VALUES
-- ('auth-user-id-from-supabase', 'Admin User', 'admin@example.com', 'CEO');