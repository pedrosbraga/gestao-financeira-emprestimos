// Script para criar usuários via API do Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yqqnqbcmnhaoxyqlheve.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxcW5xYmNtbmhhb3h5cWxoZXZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ4NTkwMiwiZXhwIjoyMDc0MDYxOTAyfQ.SZ8QI7Q_t1exq7SHq8tLt73swRu_T2GIIPxGteHoP9Y';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createUsers() {
  const users = [
    { email: 'ceo@empresa.com', password: '123456789', name: 'CEO da Empresa', type: 'CEO' },
    { email: 'gerente@empresa.com', password: '123456789', name: 'Gerente Financeiro', type: 'GERENTE' },
    { email: 'financeiro@empresa.com', password: '123456789', name: 'Analista Financeiro', type: 'FINANCEIRO' }
  ];

  console.log('🚀 Criando usuários via API do Supabase...\n');

  for (const userData of users) {
    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      });

      if (authError) {
        console.error(`❌ Erro ao criar ${userData.email}:`, authError.message);
        continue;
      }

      console.log(`✅ Usuário criado no Auth: ${userData.email} (ID: ${authData.user.id})`);

      // Criar perfil na tabela public.users
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          user_type: userData.type
        });

      if (profileError) {
        console.error(`❌ Erro ao criar perfil para ${userData.email}:`, profileError.message);
      } else {
        console.log(`✅ Perfil criado: ${userData.name} (${userData.type})`);
      }

      console.log('');
    } catch (error) {
      console.error(`❌ Erro geral para ${userData.email}:`, error.message);
    }
  }

  console.log('🎉 Processo concluído!');
  console.log('\n📋 Credenciais para login:');
  console.log('👑 CEO: ceo@empresa.com / 123456789');
  console.log('👨‍💼 GERENTE: gerente@empresa.com / 123456789');
  console.log('💰 FINANCEIRO: financeiro@empresa.com / 123456789');
  console.log('\n🚀 Agora teste o login no app!');
}

createUsers().catch(console.error);