# 🚀 Configuração Completa do Supabase

## 📋 O que foi criado

### ✅ Estrutura de Migrações
```
supabase/migrations/
├── 20240101000001_initial_schema.sql      # Tabelas e tipos
├── 20240101000002_functions_and_triggers.sql  # Lógica de negócio
├── 20240101000003_rls_policies.sql        # Segurança
└── 20240101000004_seed_data.sql           # Dados de exemplo
```

### ✅ Scripts Automatizados
```
scripts/
└── setup-supabase.sh                     # Setup completo
```

### ✅ Comandos NPM
```bash
npm run supabase:setup    # Setup completo
npm run supabase:push     # Aplicar migrações
npm run supabase:reset    # Reset do banco
npm run supabase:types    # Gerar tipos TS
npm run supabase:status   # Status do projeto
```

## 🎯 Como Executar

### Opção 1: Script Automático (Recomendado)

```bash
# 1. Faça login no Supabase
supabase login

# 2. Configure o .env com suas credenciais
cp .env.example .env
# Edite o .env com suas credenciais

# 3. Execute o setup automático
npm run supabase:setup
```

### Opção 2: Passo a Passo Manual

```bash
# 1. Login
supabase login

# 2. Conectar ao projeto
supabase link --project-ref SEU_PROJECT_ID

# 3. Aplicar migrações
npm run supabase:push

# 4. Gerar tipos
npm run supabase:types

# 5. Testar
npm test
```

## 🔧 Configuração das Credenciais

### 1. Obter Credenciais do Supabase

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em Settings > API
4. Copie:
   - Project URL
   - anon public key

### 2. Configurar .env

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
EXPO_PUBLIC_APP_ENV=development
```

## 👥 Criando Usuários

### 1. No Supabase Auth

1. Acesse: https://app.supabase.com/project/SEU_PROJETO/auth/users
2. Clique "Add user"
3. Preencha email e senha

### 2. No Banco de Dados

Para cada usuário criado no Auth, execute:

```sql
INSERT INTO public.users (id, name, email, user_type) VALUES
('auth-user-id-aqui', 'Nome do Usuário', 'email@exemplo.com', 'CEO');
```

### 3. Tipos de Usuário

| Tipo | Permissões |
|------|------------|
| **CEO** | Acesso total, gerenciar usuários, deletar registros |
| **GERENTE** | Gerenciar clientes/empréstimos, sem deletar |
| **FINANCEIRO** | Apenas registrar e visualizar pagamentos |

## 🎲 Dados de Exemplo

Para adicionar dados de teste:

```sql
-- Execute no SQL Editor
SELECT create_sample_data('id-do-usuario-ceo');
```

Isso criará:
- 3 clientes de exemplo
- 3 empréstimos
- 2 pagamentos de exemplo

## 🧪 Testando a Configuração

### 1. Verificar Status
```bash
npm run supabase:status
```

### 2. Executar Testes
```bash
npm test
```

### 3. Testar no App
```bash
npm start
```

## 🔒 Segurança Implementada

### ✅ Row Level Security (RLS)
- Todas as tabelas protegidas
- Políticas baseadas no tipo de usuário
- Acesso controlado por função

### ✅ Audit Trail
- Todas as alterações são logadas
- Rastreamento de usuário e timestamp
- Histórico imutável

### ✅ Triggers Automáticos
- Atualização de saldos
- Geração de pagamentos mensais
- Marcação automática de pagamentos

## 🚨 Solução de Problemas

### Erro: "Project not found"
```bash
supabase projects list
# Verifique o ID do projeto
```

### Erro: "Migration failed"
```bash
npm run supabase:reset
npm run supabase:push
```

### Erro: "Permission denied"
- Verifique se o usuário existe em `public.users`
- Confirme o `user_type` correto

### Erro: "RLS blocking queries"
```sql
-- Verificar usuário atual
SELECT * FROM public.users WHERE id = auth.uid();

-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'loans';
```

## 📊 Estrutura do Banco

### Tabelas Principais
- `users` - Usuários do sistema
- `clients` - Clientes
- `loans` - Empréstimos
- `payments` - Pagamentos
- `monthly_payments` - Controle mensal
- `audit_log` - Log de auditoria

### Relacionamentos
```
users (1) -----> (N) clients
clients (1) ----> (N) loans
loans (1) ------> (N) payments
loans (1) ------> (N) monthly_payments
```

## 🎉 Próximos Passos

Após a configuração:

1. **Criar usuários de produção**
2. **Configurar backup automático**
3. **Implementar monitoramento**
4. **Deploy da aplicação**
5. **Configurar domínio customizado**

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `supabase logs`
2. Consulte a documentação: https://supabase.com/docs
3. Verifique o status: `npm run supabase:status`

---

**🎯 Tudo pronto para desenvolvimento!** 

O sistema está configurado com:
- ✅ Autenticação segura
- ✅ Controle de permissões
- ✅ Auditoria completa
- ✅ Testes automatizados
- ✅ Tipos TypeScript