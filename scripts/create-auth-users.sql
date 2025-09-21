-- Script para criar usuários diretamente no auth.users e public.users
-- ATENÇÃO: Este método é para desenvolvimento/demonstração apenas

-- Primeiro, vamos criar uma função que insere usuários no auth.users
CREATE OR REPLACE FUNCTION create_auth_user_direct(
    user_email TEXT,
    user_password TEXT,
    user_name TEXT,
    user_type_param user_type
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
    encrypted_password TEXT;
    confirmation_token TEXT;
BEGIN
    -- Gerar ID único
    new_user_id := gen_random_uuid();
    
    -- Criptografar senha usando crypt
    encrypted_password := crypt(user_password, gen_salt('bf'));
    
    -- Gerar token de confirmação
    confirmation_token := encode(gen_random_bytes(32), 'base64');
    
    -- Inserir no auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        user_email,
        encrypted_password,
        NOW(),
        NOW(),
        confirmation_token,
        NOW(),
        '',
        NULL,
        '',
        '',
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        FALSE,
        NOW(),
        NOW(),
        NULL,
        NULL,
        '',
        '',
        NULL,
        '',
        0,
        NULL,
        '',
        NULL,
        FALSE,
        NULL
    );
    
    -- Inserir no public.users
    INSERT INTO public.users (
        id,
        name,
        email,
        user_type,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        user_name,
        user_email,
        user_type_param,
        NOW(),
        NOW()
    );
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar os usuários de demonstração
DO $$
DECLARE
    ceo_id UUID;
    gerente_id UUID;
    financeiro_id UUID;
BEGIN
    -- Criar CEO
    ceo_id := create_auth_user_direct(
        'ceo@empresa.com',
        '123456789',
        'CEO da Empresa',
        'CEO'
    );
    
    -- Criar Gerente
    gerente_id := create_auth_user_direct(
        'gerente@empresa.com',
        '123456789',
        'Gerente Financeiro',
        'GERENTE'
    );
    
    -- Criar Financeiro
    financeiro_id := create_auth_user_direct(
        'financeiro@empresa.com',
        '123456789',
        'Analista Financeiro',
        'FINANCEIRO'
    );
    
    -- Criar dados de exemplo
    PERFORM create_sample_data(ceo_id);
    
    -- Mostrar resultados
    RAISE NOTICE '🎉 Usuários criados com sucesso!';
    RAISE NOTICE '';
    RAISE NOTICE '👑 CEO:';
    RAISE NOTICE '   Email: ceo@empresa.com';
    RAISE NOTICE '   Senha: 123456789';
    RAISE NOTICE '   ID: %', ceo_id;
    RAISE NOTICE '';
    RAISE NOTICE '👨‍💼 GERENTE:';
    RAISE NOTICE '   Email: gerente@empresa.com';
    RAISE NOTICE '   Senha: 123456789';
    RAISE NOTICE '   ID: %', gerente_id;
    RAISE NOTICE '';
    RAISE NOTICE '💰 FINANCEIRO:';
    RAISE NOTICE '   Email: financeiro@empresa.com';
    RAISE NOTICE '   Senha: 123456789';
    RAISE NOTICE '   ID: %', financeiro_id;
    RAISE NOTICE '';
    RAISE NOTICE '📊 Dados de exemplo criados!';
    RAISE NOTICE '   - 3 clientes cadastrados';
    RAISE NOTICE '   - 3 empréstimos ativos';
    RAISE NOTICE '   - 2 pagamentos registrados';
    RAISE NOTICE '   - Pagamentos mensais gerados';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Sistema pronto para uso!';
    RAISE NOTICE '   Execute: npm start';
END $$;