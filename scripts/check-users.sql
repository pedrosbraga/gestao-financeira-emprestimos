-- Verificar usuários criados
SELECT 
    'auth.users' as tabela,
    COUNT(*) as total,
    array_agg(email) as emails
FROM auth.users
UNION ALL
SELECT 
    'public.users' as tabela,
    COUNT(*) as total,
    array_agg(email) as emails
FROM public.users;