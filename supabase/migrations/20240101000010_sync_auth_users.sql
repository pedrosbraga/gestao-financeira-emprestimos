-- Sincronizar usuários do auth.users com public.users

-- Função para sincronizar usuários
CREATE OR REPLACE FUNCTION sync_auth_users()
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
    user_name TEXT;
    user_type_val user_type;
    sync_count INTEGER := 0;
BEGIN
    -- Buscar usuários do auth.users que não estão em public.users
    FOR user_record IN 
        SELECT au.id, au.email 
        FROM auth.users au 
        LEFT JOIN public.users pu ON au.id = pu.id 
        WHERE pu.id IS NULL 
        AND au.email IN ('ceo@empresa.com', 'gerente@empresa.com', 'financeiro@empresa.com')
    LOOP
        -- Determinar nome e tipo baseado no email
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
            ELSE
                user_name := 'Usuário';
                user_type_val := 'FINANCEIRO';
        END CASE;
        
        -- Inserir na tabela public.users
        INSERT INTO public.users (
            id,
            name,
            email,
            user_type,
            created_at,
            updated_at
        ) VALUES (
            user_record.id,
            user_name,
            user_record.email,
            user_type_val,
            NOW(),
            NOW()
        );
        
        sync_count := sync_count + 1;
        
        RAISE NOTICE 'Usuário sincronizado: % (%) - ID: %', user_name, user_type_val, user_record.id;
    END LOOP;
    
    IF sync_count > 0 THEN
        RETURN format('✅ %s usuários sincronizados com sucesso!', sync_count);
    ELSE
        RETURN '⚠️ Nenhum usuário novo encontrado para sincronizar.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar sincronização
SELECT sync_auth_users() as resultado;

-- Mostrar usuários sincronizados
SELECT 
    'Usuários em public.users:' as info,
    COUNT(*) as total
FROM public.users
UNION ALL
SELECT 
    'Emails:' as info,
    0 as total;

-- Listar usuários
SELECT 
    name,
    email,
    user_type,
    id
FROM public.users
ORDER BY user_type;