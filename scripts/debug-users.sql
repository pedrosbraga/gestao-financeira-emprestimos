-- Script para debugar usuários

-- 1. Verificar usuários no auth.users
SELECT 
    'AUTH.USERS' as tabela,
    COUNT(*) as total_usuarios,
    array_agg(email) as emails
FROM auth.users 
WHERE email IN ('ceo@empresa.com', 'gerente@empresa.com', 'financeiro@empresa.com');

-- 2. Verificar usuários no public.users
SELECT 
    'PUBLIC.USERS' as tabela,
    COUNT(*) as total_usuarios,
    array_agg(email) as emails
FROM public.users 
WHERE email IN ('ceo@empresa.com', 'gerente@empresa.com', 'financeiro@empresa.com');

-- 3. Listar detalhes dos usuários no auth.users
SELECT 
    'DETALHES AUTH.USERS' as info,
    email,
    id,
    email_confirmed_at IS NOT NULL as email_confirmado,
    created_at
FROM auth.users 
WHERE email IN ('ceo@empresa.com', 'gerente@empresa.com', 'financeiro@empresa.com')
ORDER BY email;

-- 4. Listar detalhes dos usuários no public.users
SELECT 
    'DETALHES PUBLIC.USERS' as info,
    name,
    email,
    user_type,
    id,
    created_at
FROM public.users 
WHERE email IN ('ceo@empresa.com', 'gerente@empresa.com', 'financeiro@empresa.com')
ORDER BY email;

-- 5. Verificar usuários órfãos (em auth.users mas não em public.users)
SELECT 
    'USUARIOS ORFAOS' as problema,
    au.email,
    au.id,
    'Existe no auth.users mas não no public.users' as descricao
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email IN ('ceo@empresa.com', 'gerente@empresa.com', 'financeiro@empresa.com')
AND pu.id IS NULL;