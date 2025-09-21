#!/bin/bash

# Script para verificar a segurança do projeto

echo "🔒 Verificando segurança do projeto..."
echo ""

# Verificar se o arquivo .env está sendo ignorado
echo "📁 Verificando .gitignore..."
if git check-ignore .env > /dev/null 2>&1; then
    echo "✅ Arquivo .env está sendo ignorado corretamente"
else
    echo "❌ ATENÇÃO: Arquivo .env NÃO está sendo ignorado!"
    echo "   Adicione '.env' ao .gitignore imediatamente"
fi

# Verificar se existem arquivos .env commitados
echo ""
echo "🔍 Verificando arquivos .env no histórico..."
if git log --all --full-history -- .env > /dev/null 2>&1; then
    echo "⚠️  ATENÇÃO: Arquivo .env foi encontrado no histórico do Git!"
    echo "   Considere limpar o histórico ou criar um novo repositório"
else
    echo "✅ Nenhum arquivo .env encontrado no histórico"
fi

# Verificar dependências vulneráveis
echo ""
echo "🔍 Verificando vulnerabilidades nas dependências..."
if npm audit --audit-level moderate; then
    echo "✅ Nenhuma vulnerabilidade moderada ou alta encontrada"
else
    echo "⚠️  Vulnerabilidades encontradas. Execute 'npm audit fix' para corrigir"
fi

# Verificar se existem secrets hardcoded
echo ""
echo "🔍 Procurando por possíveis secrets no código..."
SECRETS_FOUND=false

# Procurar por padrões comuns de API keys
if grep -r -i "api[_-]key\|secret\|password\|token" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "// " | grep -v "test" | grep -v "mock"; then
    echo "⚠️  Possíveis secrets encontrados no código!"
    SECRETS_FOUND=true
fi

# Procurar por URLs hardcoded
if grep -r "https://.*supabase" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "config" | grep -v "example"; then
    echo "⚠️  URLs do Supabase hardcoded encontradas!"
    SECRETS_FOUND=true
fi

if [ "$SECRETS_FOUND" = false ]; then
    echo "✅ Nenhum secret hardcoded encontrado"
fi

# Verificar permissões de arquivos sensíveis
echo ""
echo "🔍 Verificando permissões de arquivos..."
if [ -f ".env" ]; then
    PERMS=$(stat -f "%A" .env 2>/dev/null || stat -c "%a" .env 2>/dev/null)
    if [ "$PERMS" = "600" ] || [ "$PERMS" = "644" ]; then
        echo "✅ Permissões do .env estão adequadas ($PERMS)"
    else
        echo "⚠️  Permissões do .env podem ser muito abertas ($PERMS)"
        echo "   Considere executar: chmod 600 .env"
    fi
fi

# Verificar se o Supabase RLS está configurado
echo ""
echo "🔍 Verificando configuração do Supabase..."
if [ -f "supabase/rls-policies.sql" ]; then
    echo "✅ Políticas RLS encontradas"
else
    echo "⚠️  Políticas RLS não encontradas"
fi

echo ""
echo "🔒 Verificação de segurança concluída!"
echo ""
echo "📋 Recomendações de segurança:"
echo "1. Mantenha sempre o .env fora do controle de versão"
echo "2. Use variáveis de ambiente para todas as configurações sensíveis"
echo "3. Execute 'npm audit' regularmente"
echo "4. Configure Row Level Security no Supabase"
echo "5. Use HTTPS para todas as comunicações"
echo "6. Mantenha as dependências atualizadas"