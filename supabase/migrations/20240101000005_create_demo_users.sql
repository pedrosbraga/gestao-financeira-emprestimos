-- Instruções para criar usuários de demonstração
-- Este script apenas cria as funções auxiliares

-- Função para criar usuário na tabela public.users após criação no Auth
CREATE OR REPLACE FUNCTION create_demo_user(
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    user_type_param user_type
)
RETURNS UUID AS $$
BEGIN
    -- Inserir no public.users (assumindo que o auth.users já existe)
    INSERT INTO public.users (
        id,
        name,
        email,
        user_type,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        user_name,
        user_email,
        user_type_param,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        user_type = EXCLUDED.user_type,
        updated_at = NOW();
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para configurar usuários após criação manual no Auth
CREATE OR REPLACE FUNCTION setup_demo_users()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Para configurar usuários de demonstração:

1. Acesse: https://supabase.com/dashboard/project/yqqnqbcmnhaoxyqlheve/auth/users

2. Clique "Add user" e crie:
   - Email: ceo@empresa.com, Senha: 123456789
   - Email: gerente@empresa.com, Senha: 123456789  
   - Email: financeiro@empresa.com, Senha: 123456789

3. Para cada usuário criado, execute no SQL Editor:
   SELECT create_demo_user(
       ''ID_DO_USUARIO_CRIADO'',
       ''email@empresa.com'',
       ''Nome do Usuário'',
       ''CEO''::user_type
   );

4. Para criar dados de exemplo, execute:
   SELECT create_sample_data(''ID_DO_CEO'');

Exemplo completo:
   SELECT create_demo_user(''uuid-do-ceo'', ''ceo@empresa.com'', ''CEO da Empresa'', ''CEO'');
   SELECT create_demo_user(''uuid-do-gerente'', ''gerente@empresa.com'', ''Gerente'', ''GERENTE'');
   SELECT create_demo_user(''uuid-do-financeiro'', ''financeiro@empresa.com'', ''Financeiro'', ''FINANCEIRO'');
   SELECT create_sample_data(''uuid-do-ceo'');';
END;
$$ LANGUAGE plpgsql;

-- Mostrar instruções
SELECT setup_demo_users() as instructions;