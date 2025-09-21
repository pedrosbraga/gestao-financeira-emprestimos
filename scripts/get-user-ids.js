// Script para buscar IDs dos usuários criados
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yqqnqbcmnhaoxyqlheve.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxcW5xYmNtbmhhb3h5cWxoZXZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ4NTkwMiwiZXhwIjoyMDc0MDYxOTAyfQ.SZ8QI7Q_t1exq7SHq8tLt73swRu_T2GIIPxGteHoP9Y';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function getUserIds() {
  console.log('🔍 Buscando usuários criados...\n');

  try {
    // Buscar usuários do Auth
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ Erro ao buscar usuários:', error.message);
      return;
    }

    console.log('📋 Usuários encontrados no Auth:');
    const targetEmails = ['ceo@empresa.com', 'gerente@empresa.com', 'financeiro@empresa.com'];
    
    const foundUsers = authUsers.users.filter(user => 
      targetEmails.includes(user.email)
    );

    foundUsers.forEach(user => {
      console.log(`📧 ${user.email} - ID: ${user.id}`);
    });

    if (foundUsers.length > 0) {
      console.log('\n🔗 Agora vou criar os perfis na tabela public.users...');
      
      for (const user of foundUsers) {
        const userType = getUserType(user.email);
        const userName = getUserName(user.email);
        
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            name: userName,
            email: user.email,
            user_type: userType
          });

        if (profileError) {
          console.error(`❌ Erro ao criar perfil para ${user.email}:`, profileError.message);
        } else {
          console.log(`✅ Perfil criado: ${userName} (${userType})`);
        }
      }

      console.log('\n🎉 Perfis criados com sucesso!');
      console.log('🚀 Agora teste o login novamente!');
    } else {
      console.log('❌ Nenhum usuário encontrado com os emails esperados.');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

function getUserType(email) {
  if (email === 'ceo@empresa.com') return 'CEO';
  if (email === 'gerente@empresa.com') return 'GERENTE';
  if (email === 'financeiro@empresa.com') return 'FINANCEIRO';
  return 'FINANCEIRO';
}

function getUserName(email) {
  if (email === 'ceo@empresa.com') return 'CEO da Empresa';
  if (email === 'gerente@empresa.com') return 'Gerente Financeiro';
  if (email === 'financeiro@empresa.com') return 'Analista Financeiro';
  return 'Usuário';
}

getUserIds();