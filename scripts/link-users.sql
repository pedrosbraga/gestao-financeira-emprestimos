-- Execute este SQL após criar os usuários no Dashboard
-- Substitua os IDs pelos IDs reais dos usuários criados

-- Para o CEO (substitua 'ID_DO_CEO' pelo ID real)
INSERT INTO public.users (id, name, email, user_type) VALUES
('ID_DO_CEO', 'CEO da Empresa', 'ceo@empresa.com', 'CEO')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    user_type = EXCLUDED.user_type;

-- Para o Gerente (substitua 'ID_DO_GERENTE' pelo ID real)
INSERT INTO public.users (id, name, email, user_type) VALUES
('ID_DO_GERENTE', 'Gerente Financeiro', 'gerente@empresa.com', 'GERENTE')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    user_type = EXCLUDED.user_type;

-- Para o Financeiro (substitua 'ID_DO_FINANCEIRO' pelo ID real)
INSERT INTO public.users (id, name, email, user_type) VALUES
('ID_DO_FINANCEIRO', 'Analista Financeiro', 'financeiro@empresa.com', 'FINANCEIRO')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    user_type = EXCLUDED.user_type;