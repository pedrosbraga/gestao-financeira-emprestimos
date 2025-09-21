-- Debug: Verificar estado dos usuários

-- Executar debug
SELECT 'AUTH.USERS' as tabela, COUNT(*) as total FROM auth.users WHERE email IN ('ceo@empresa.com', 'gerente@empresa.com', 'financeiro@empresa.com');
SELECT 'PUBLIC.USERS' as tabela, COUNT(*) as total FROM public.users WHERE email IN ('ceo@empresa.com', 'gerente@empresa.com', 'financeiro@empresa.com');

-- Listar usuários órfãos e tentar sincronizar
DO $$
DECLARE
    user_record RECORD;
    user_name TEXT;
    user_type_val user_type;
    sync_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔍 VERIFICANDO USUÁRIOS...';
    
    -- Buscar usuários órfãos
    FOR user_record IN 
        SELECT au.id, au.email, au.email_confirmed_at
        FROM auth.users au 
        LEFT JOIN public.users pu ON au.id = pu.id 
        WHERE pu.id IS NULL 
        AND au.email IN ('ceo@empresa.com', 'gerente@empresa.com', 'financeiro@empresa.com')
    LOOP
        RAISE NOTICE 'Usuário órfão encontrado: % (ID: %)', user_record.email, user_record.id;
        
        -- Determinar nome e tipo
        CASE user_record.email
            WHEN 'ceo@empresa.com' THEN
                user_name := 'CEO da Empresa';
                user_type_val := 'CEO';
            WHEN 'gerente@empresa.com' THEN
                user_name := 'Gerente Financeiro';
                user_type_val := 'GERENTE';
            WHEN 'financeiro@empresa.com' THEN
                user_name := 'Analista Financeiro';
                user_type_val := 'FINANCEIRO';
        END CASE;
        
        -- Inserir perfil
        INSERT INTO public.users (
            id, name, email, user_type, created_at, updated_at
        ) VALUES (
            user_record.id, user_name, user_record.email, user_type_val, NOW(), NOW()
        );
        
        sync_count := sync_count + 1;
        RAISE NOTICE '✅ Perfil criado: % (%)', user_name, user_type_val;
    END LOOP;
    
    IF sync_count = 0 THEN
        RAISE NOTICE '✅ Todos os usuários já estão sincronizados!';
    ELSE
        RAISE NOTICE '🎉 % usuários sincronizados!', sync_count;
    END IF;
    
    -- Mostrar estado final
    RAISE NOTICE '';
    RAISE NOTICE '📊 ESTADO FINAL:';
    
    FOR user_record IN 
        SELECT pu.name, pu.email, pu.user_type, pu.id
        FROM public.users pu
        WHERE pu.email IN ('ceo@empresa.com', 'gerente@empresa.com', 'financeiro@empresa.com')
        ORDER BY pu.user_type
    LOOP
        RAISE NOTICE '👤 %: % (%)', user_record.user_type, user_record.name, user_record.email;
    END LOOP;
END $$;