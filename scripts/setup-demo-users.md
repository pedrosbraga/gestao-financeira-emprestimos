# 👥 Guia para Criar Usuários de Demonstração

## 🎯 Passo a Passo Completo

### 1. **Acesse o Supabase Auth**
🔗 **Link direto:** https://supabase.com/dashboard/project/yqqnqbcmnhaoxyqlheve/auth/users

### 2. **Criar Usuários no Auth**

Clique **"Add user"** e crie cada usuário:

#### 👑 **CEO**
- **Email:** `ceo@empresa.com`
- **Password:** `123456789`
- **Confirm password:** ✅

#### 👨‍💼 **Gerente**
- **Email:** `gerente@empresa.com`  
- **Password:** `123456789`
- **Confirm password:** ✅

#### 💰 **Financeiro**
- **Email:** `financeiro@empresa.com`
- **Password:** `123456789`
- **Confirm password:** ✅

### 3. **Copiar IDs dos Usuários**

Após criar cada usuário, **copie o ID** que aparece na lista (formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 4. **Executar SQL para Configurar Perfis**

🔗 **Acesse o SQL Editor:** https://supabase.com/dashboard/project/yqqnqbcmnhaoxyqlheve/sql/new

**Cole e execute este SQL** (substitua os IDs pelos reais):

```sql
-- Substitua pelos IDs reais dos usuários criados
DO $$
DECLARE
    ceo_id UUID := 'ID_DO_CEO_AQUI';
    gerente_id UUID := 'ID_DO_GERENTE_AQUI';
    financeiro_id UUID := 'ID_DO_FINANCEIRO_AQUI';
BEGIN
    -- Criar perfil do CEO
    PERFORM create_demo_user(
        ceo_id,
        'ceo@empresa.com',
        'CEO da Empresa',
        'CEO'
    );
    
    -- Criar perfil do Gerente
    PERFORM create_demo_user(
        gerente_id,
        'gerente@empresa.com',
        'Gerente Financeiro',
        'GERENTE'
    );
    
    -- Criar perfil do Financeiro
    PERFORM create_demo_user(
        financeiro_id,
        'financeiro@empresa.com',
        'Analista Financeiro',
        'FINANCEIRO'
    );
    
    -- Criar dados de exemplo
    PERFORM create_sample_data(ceo_id);
    
    RAISE NOTICE 'Usuários configurados com sucesso!';
    RAISE NOTICE 'CEO ID: %', ceo_id;
    RAISE NOTICE 'GERENTE ID: %', gerente_id;
    RAISE NOTICE 'FINANCEIRO ID: %', financeiro_id;
END $$;
```

### 5. **Verificar Configuração**

Execute este SQL para verificar se tudo foi criado:

```sql
-- Verificar usuários
SELECT id, name, email, user_type, created_at 
FROM public.users 
ORDER BY user_type;

-- Verificar dados de exemplo
SELECT 
    c.name as cliente,
    l.amount as valor_emprestimo,
    l.interest_rate as taxa_juros,
    l.status,
    l.remaining_balance as saldo_restante
FROM public.loans l
JOIN public.clients c ON c.id = l.client_id;
```

## 🎉 Resultado Esperado

Após executar, você terá:

### ✅ **3 Usuários Criados:**
- **CEO:** Acesso total ao sistema
- **GERENTE:** Gerenciar clientes e empréstimos  
- **FINANCEIRO:** Apenas pagamentos

### ✅ **Dados de Exemplo:**
- **3 clientes** cadastrados
- **3 empréstimos** ativos
- **2 pagamentos** registrados
- **Pagamentos mensais** gerados automaticamente

## 🧪 **Testar o Sistema**

### 1. **Iniciar o App:**
```bash
npm start
```

### 2. **Fazer Login:**
- **CEO:** `ceo@empresa.com` / `123456789`
- **Gerente:** `gerente@empresa.com` / `123456789`
- **Financeiro:** `financeiro@empresa.com` / `123456789`

### 3. **Verificar Permissões:**
- **CEO:** Deve ver tudo
- **Gerente:** Não deve ver gerenciamento de usuários
- **Financeiro:** Apenas área de pagamentos

## 🔧 **Comandos Úteis**

```bash
# Ver status do projeto
npm run supabase:status

# Gerar tipos atualizados
npm run supabase:types

# Executar testes
npm test

# Reset do banco (se necessário)
npm run supabase:reset
```

## 🚨 **Solução de Problemas**

### Erro: "User not found"
- Verifique se o usuário existe em `auth.users`
- Confirme que o ID está correto

### Erro: "Permission denied"  
- Verifique se o usuário foi criado em `public.users`
- Confirme o `user_type` correto

### Erro: "RLS blocking"
- Execute: `SELECT * FROM public.users WHERE id = auth.uid();`
- Deve retornar o usuário logado

---

**🎯 Tudo pronto para testar o sistema completo!** 🚀