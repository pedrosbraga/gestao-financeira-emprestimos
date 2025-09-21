# Política de Segurança

## Versões Suportadas

Atualmente, oferecemos suporte de segurança para as seguintes versões:

| Versão | Suportada          |
| ------ | ------------------ |
| 1.0.x  | :white_check_mark: |
| < 1.0  | :x:                |

## Relatando uma Vulnerabilidade

A segurança é uma prioridade para nós. Se você descobrir uma vulnerabilidade de segurança, por favor, nos informe de forma responsável.

### Como Reportar

1. **NÃO** abra uma issue pública para vulnerabilidades de segurança
2. Envie um email para: [seu-email-de-seguranca@exemplo.com]
3. Inclua o máximo de informações possível:
   - Descrição da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Versão afetada

### O que Esperar

- **Confirmação**: Responderemos em até 48 horas
- **Avaliação**: Avaliaremos a vulnerabilidade em até 7 dias
- **Correção**: Trabalharemos para corrigir vulnerabilidades críticas em até 30 dias
- **Divulgação**: Coordenaremos a divulgação responsável após a correção

### Recompensas

Atualmente não oferecemos um programa de bug bounty, mas reconhecemos publicamente pesquisadores responsáveis que nos ajudam a melhorar a segurança.

## Práticas de Segurança

### Dados Sensíveis

- Todas as chaves de API devem ser armazenadas em variáveis de ambiente
- Nunca commite credenciais no código
- Use HTTPS para todas as comunicações
- Implemente autenticação e autorização adequadas

### Dependências

- Mantenha todas as dependências atualizadas
- Execute `npm audit` regularmente
- Use ferramentas de análise de segurança

### Banco de Dados

- Use Row Level Security (RLS) no Supabase
- Valide todas as entradas do usuário
- Use prepared statements para prevenir SQL injection
- Criptografe dados sensíveis

## Contato

Para questões de segurança, entre em contato:
- Email: [seu-email-de-seguranca@exemplo.com]
- Para questões não relacionadas à segurança, use as issues do GitHub