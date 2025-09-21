#!/bin/bash

# Script para configurar o repositório GitHub
# Execute este script após criar o repositório no GitHub

echo "🚀 Configurando repositório GitHub..."

# Verificar se o usuário forneceu o username
if [ -z "$1" ]; then
    echo "❌ Erro: Forneça seu username do GitHub"
    echo "Uso: ./scripts/setup-github.sh SEU_USERNAME"
    exit 1
fi

USERNAME=$1
REPO_NAME="gestao-financeira-emprestimos"

echo "👤 Username: $USERNAME"
echo "📁 Repositório: $REPO_NAME"

# Verificar se já existe um remote
if git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  Remote 'origin' já existe. Removendo..."
    git remote remove origin
fi

# Adicionar o remote do GitHub
echo "🔗 Adicionando remote do GitHub..."
git remote add origin "https://github.com/$USERNAME/$REPO_NAME.git"

# Verificar se o remote foi adicionado corretamente
if git remote get-url origin > /dev/null 2>&1; then
    echo "✅ Remote adicionado com sucesso!"
    echo "🌐 URL: $(git remote get-url origin)"
else
    echo "❌ Erro ao adicionar remote"
    exit 1
fi

# Fazer push para o GitHub
echo "📤 Fazendo push para o GitHub..."
if git push -u origin main; then
    echo "✅ Push realizado com sucesso!"
    echo ""
    echo "🎉 Repositório configurado no GitHub!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Acesse: https://github.com/$USERNAME/$REPO_NAME"
    echo "2. Configure os Secrets em Settings > Secrets and variables > Actions:"
    echo "   - EXPO_PUBLIC_SUPABASE_URL"
    echo "   - EXPO_PUBLIC_SUPABASE_ANON_KEY"
    echo "3. Ative as GitHub Actions se necessário"
    echo ""
    echo "🔒 Lembre-se de manter o arquivo .env seguro e nunca commitá-lo!"
else
    echo "❌ Erro ao fazer push. Verifique se o repositório foi criado no GitHub."
    echo "💡 Certifique-se de que o repositório existe em: https://github.com/$USERNAME/$REPO_NAME"
fi