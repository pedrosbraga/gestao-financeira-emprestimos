# Gestão Financeira de Empréstimos

Sistema de gestão financeira para controle de empréstimos entre pessoas físicas, desenvolvido com React Native e Expo.

## 📱 Sobre o Projeto

Este aplicativo foi desenvolvido para facilitar o controle e gestão de empréstimos pessoais, oferecendo funcionalidades completas para:

- Cadastro e gestão de clientes
- Controle de empréstimos ativos
- Registro de pagamentos (juros e principal)
- Controle mensal de recebimentos
- Relatórios financeiros e resumos
- Funcionamento offline com sincronização automática

## 🚀 Tecnologias Utilizadas

- **React Native** - Framework para desenvolvimento mobile
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Linguagem de programação
- **Supabase** - Backend as a Service (autenticação, banco de dados)
- **SQLite** - Banco de dados local para funcionamento offline
- **Redux Toolkit** - Gerenciamento de estado
- **Zod** - Validação de dados
- **Jest** - Testes unitários e de integração

## 🏗️ Arquitetura

O projeto segue uma arquitetura offline-first com sincronização bidirecional:

```
src/
├── components/          # Componentes reutilizáveis
├── screens/            # Telas da aplicação
├── services/           # Serviços (API, Database, Sync)
├── store/              # Redux store e slices
├── types/              # Definições de tipos TypeScript
├── validators/         # Validadores Zod
└── utils/              # Utilitários e helpers
```

### Principais Serviços

- **SQLiteService**: Gerenciamento do banco local
- **SyncService**: Sincronização com Supabase
- **AuthService**: Autenticação e autorização

## 📋 Funcionalidades

### ✅ Implementadas

- [x] Sistema de autenticação com diferentes níveis de acesso
- [x] Estrutura de dados completa com validação
- [x] Banco de dados local SQLite
- [x] Sincronização offline/online
- [x] Validadores de dados com Zod
- [x] Testes unitários e de integração

### 🚧 Em Desenvolvimento

- [ ] Interface de usuário completa
- [ ] Telas de cadastro de clientes
- [ ] Telas de gestão de empréstimos
- [ ] Controle mensal de pagamentos
- [ ] Relatórios e dashboards

## 🛠️ Configuração do Ambiente

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Expo CLI
- Conta no Supabase

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/gestao-financeira-emprestimos.git
cd gestao-financeira-emprestimos
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações do Supabase:
```env
EXPO_PUBLIC_SUPABASE_URL=sua_url_do_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

4. Configure o Supabase:
```bash
npm run supabase:setup
```

5. Execute o projeto:
```bash
npm start
```

## 🧪 Testes

Execute os testes unitários:
```bash
npm test
```

Execute os testes com coverage:
```bash
npm run test:coverage
```

Execute apenas os testes de validadores:
```bash
npm test -- --testPathPattern=validators
```

## 📊 Estrutura do Banco de Dados

### Entidades Principais

- **Users**: Usuários do sistema (CEO, GERENTE, FINANCEIRO)
- **Clients**: Clientes que recebem empréstimos
- **Loans**: Empréstimos concedidos
- **Payments**: Pagamentos realizados
- **Monthly Payments**: Controle mensal de pagamentos

### Relacionamentos

```
Users (1:N) Loans
Clients (1:N) Loans
Loans (1:N) Payments
Loans (1:N) Monthly Payments
```

## 🔄 Sincronização

O sistema implementa uma arquitetura offline-first com:

- **Funcionamento offline completo**
- **Sincronização automática quando online**
- **Detecção e resolução de conflitos**
- **Estratégias de merge configuráveis**

## 🔐 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) no banco de dados
- Validação de dados em tempo real
- Criptografia de dados sensíveis

## 📱 Compatibilidade

- iOS 11.0+
- Android API 21+
- Expo SDK 54

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Equipe

- **Desenvolvedor Principal**: [Seu Nome]
- **Arquitetura**: Offline-first com React Native
- **Backend**: Supabase

## 📞 Suporte

Para suporte, envie um email para [seu-email@exemplo.com] ou abra uma issue no GitHub.

---

**Status do Projeto**: 🚧 Em Desenvolvimento Ativo

**Última Atualização**: Dezembro 2024