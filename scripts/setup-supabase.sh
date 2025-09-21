#!/bin/bash

# Setup script for Supabase configuration
# This script automates the entire Supabase setup process

set -e  # Exit on any error

echo "🚀 Iniciando configuração do Supabase..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI não está instalado!"
    print_status "Instalando via Homebrew..."
    brew install supabase/tap/supabase
    print_success "Supabase CLI instalado!"
fi

# Check if user is logged in
print_status "Verificando login no Supabase..."
if ! supabase projects list &> /dev/null; then
    print_warning "Você precisa fazer login no Supabase"
    print_status "Execute: supabase login"
    print_status "Depois execute este script novamente"
    exit 1
fi

print_success "Login verificado!"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning "Arquivo .env não encontrado"
    print_status "Copiando .env.example para .env..."
    cp .env.example .env
    print_warning "Por favor, configure suas credenciais do Supabase no arquivo .env"
    print_status "Você pode obter as credenciais em: https://app.supabase.com/project/YOUR_PROJECT/settings/api"
    exit 1
fi

# Source environment variables
source .env

# Check if environment variables are set
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ] || [ "$EXPO_PUBLIC_SUPABASE_URL" = "YOUR_SUPABASE_URL" ]; then
    print_error "EXPO_PUBLIC_SUPABASE_URL não está configurado no .env"
    exit 1
fi

if [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ] || [ "$EXPO_PUBLIC_SUPABASE_ANON_KEY" = "YOUR_SUPABASE_ANON_KEY" ]; then
    print_error "EXPO_PUBLIC_SUPABASE_ANON_KEY não está configurado no .env"
    exit 1
fi

print_success "Variáveis de ambiente configuradas!"

# Link to remote project
print_status "Conectando ao projeto Supabase..."
PROJECT_ID=$(echo $EXPO_PUBLIC_SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1/')
supabase link --project-ref $PROJECT_ID

print_success "Projeto conectado!"

# Run migrations
print_status "Executando migrações..."
supabase db push

print_success "Migrações aplicadas!"

# Generate types
print_status "Gerando tipos TypeScript..."
supabase gen types typescript --local > src/types/supabase.ts

print_success "Tipos gerados!"

# Install dependencies if needed
print_status "Verificando dependências..."
if [ ! -d "node_modules" ]; then
    print_status "Instalando dependências..."
    npm install --legacy-peer-deps
fi

print_success "Dependências verificadas!"

# Run tests
print_status "Executando testes..."
npm test

print_success "Testes executados com sucesso!"

echo ""
print_success "🎉 Configuração do Supabase concluída!"
echo ""
print_status "Próximos passos:"
echo "1. Crie usuários no Supabase Auth (https://app.supabase.com/project/$PROJECT_ID/auth/users)"
echo "2. Para cada usuário criado, execute:"
echo "   INSERT INTO public.users (id, name, email, user_type) VALUES"
echo "   ('auth-user-id', 'Nome do Usuário', 'email@exemplo.com', 'CEO');"
echo "3. Execute a função de dados de exemplo (opcional):"
echo "   SELECT create_sample_data('ceo-user-id');"
echo ""
print_status "Para iniciar o desenvolvimento:"
echo "npm start"
echo ""
print_success "Tudo pronto! 🚀"