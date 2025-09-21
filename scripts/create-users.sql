-- Script para criar usuários de exemplo
-- Este script cria usuários diretamente no auth.users e public.users

-- Função para criar usuário completo (auth + public)
CREATE OR REPLACE FUNCTION create_user_complete(
    user_email TEXT,
    user_password TEXT,
    user_name TEXT,
    user_type_param user_type
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
    encrypted_password TEXT;
BEGIN
    -- Gerar ID único
    new_user_id := gen_random_uuid();
    
    -- Criptografar senha (usando crypt do pgcrypto)
    encrypted_password := crypt(user_password, gen_salt('bf'));
    
    -- Inserir no auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        user_email,
        encrypted_password,
        NOW(),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );
    
    -- Inserir no public.users
    INSERT INTO public.users (
        id,
        name,
        email,
        user_type
    ) VALUES (
        new_user_id,
        user_name,
        user_email,
        user_type_param
    );
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar usuários de exemplo
DO $$
DECLARE
    ceo_id UUID;
    gerente_id UUID;
    financeiro_id UUID;
BEGIN
    -- Criar CEO
    ceo_id := create_user_complete(
        'ceo@empresa.com',
        '123456789',
        'CEO da Empresa',
        'CEO'
    );
    
    -- Criar Gerente
    gerente_id := create_user_complete(
        'gerente@empresa.com',
        '123456789',
        'Gerente Financeiro',
        'GERENTE'
    );
    
    -- Criar Financeiro
    financeiro_id := create_user_complete(
        'financeiro@empresa.com',
        '123456789',
        'Analista Financeiro',
        'FINANCEIRO'
    );
    
    -- Criar dados de exemplo usando o CEO
    PERFORM create_sample_data(ceo_id);
    
    -- Mostrar IDs criados
    RAISE NOTICE 'Usuários criados com sucesso:';
    RAISE NOTICE 'CEO ID: %', ceo_id;
    RAISE NOTICE 'GERENTE ID: %', gerente_id;
    RAISE NOTICE 'FINANCEIRO ID: %', financeiro_id;
END $$;