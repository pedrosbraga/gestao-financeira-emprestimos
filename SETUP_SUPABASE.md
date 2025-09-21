# 🚀 Guia de Configuração do Supabase

Este guia te levará através de todo o processo de configuração do Supabase para o projeto.

## ✅ Pré-requisitos

- [x] Supabase CLI instalado
- [ ] Conta no Supabase
- [ ] Projeto criado no Supabase

## 📋 Passo a Passo

### 1. **Login no Supabase CLI**

```bash
supabase login
```

Isso abrirá seu navegador para fazer login.

### 2. **Configurar Variáveis de Ambiente**

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` com suas credenciais:
```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Como obter as credenciais:**
- Acesse: https://app.supabase.com/project/SEU_PROJETO/settings/api
- Copie a "Project URL" e "anon public" key

### 3. **Conectar ao Projeto**

```bash
# Substitua SEU_PROJECT_ID pelo ID do seu projeto
supabase link --project-ref SEU_PROJECT_ID
```

### 4. **Aplicar Migrações**

```bash
supabase db push
```

Este comando aplicará todas as migrações:
- ✅ Schema inicial (tabelas, tipos, índices)
- ✅ Funções e triggers
- ✅ Políticas RLS
- ✅ Dados de exemplo

### 5. **Gerar Tipos TypeScript**

```bash
supabase gen types typescript --local > src/types/supabase.ts
```

### 6. **Testar a Configuração**

```bash
npm test
```

## 🎯 Verificação Final

Execute este comando para verificar se tudo está funcionando:

```bash
supabase status
```

Você deve ver algo como:
```
supabase local development setup is running.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
        anon key: eyJ...
service_role key: eyJ...
```

## 👥 Criando Usuários

### No Supabase Dashboard:

1. Acesse: https://app.supabase.com/project/SEU_PROJETO/auth/users
2. Clique em "Add user"
3. Preencha email e senha

### No Banco de Dados:

Para cada usuário criado, execute no SQL Editor:

```sql
-- Substitua os valores pelos dados reais
INSERT INTO public.users (id, name, email, user_type) VALUES
('id-do-auth-user', 'Nome do Usuário', 'email@exemplo.com', 'CEO');
```

### Tipos de Usuário:
- `CEO`: Acesso total
- `GERENTE`: Acesso limitado (sem gerenciar usuários/deletar)
- `FINANCEIRO`: Apenas pagamentos

## 🎲 Dados de Exemplo (Opcional)

Para adicionar dados de teste:

```sql
-- Execute no SQL Editor, substituindo pelo ID do usuário CEO
SELECT create_sample_data('id-do-usuario-ceo');
```

## 🚨 Solução de Problemas

### Erro: "Project not found"
```bash
supabase projects list
# Verifique se o projeto existe e copie o ID correto
```

### Erro: "Migration failed"
```bash
supabase db reset
supabase db push
```

### Erro: "RLS blocking queries"
- Verifique se o usuário existe na tabela `public.users`
- Confirme que o `user_type` está correto

## 📱 Testando no App

1. Inicie o app:
```bash
npm start
```

2. Teste o login com os usuários criados

3. Verifique as permissões baseadas no tipo de usuário

## 🎉 Pronto!

Seu Supabase está configurado e pronto para uso! 

### Próximos Passos:
- [ ] Criar usuários de produção
- [ ] Configurar backup automático
- [ ] Configurar monitoramento
- [ ] Deploy da aplicação

---

**Precisa de ajuda?** Verifique os logs com:
```bash
supabase logs
```