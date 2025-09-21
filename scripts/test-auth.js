// Script para testar autenticação
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yqqnqbcmnhaoxyqlheve.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxcW5xYmNtbmhhb3h5cWxoZXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0ODU5MDIsImV4cCI6MjA3NDA2MTkwMn0.ZGVLIP_imXvZTbjQC7gu-_8PfHsj3eDcOG2LXGDOiy8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('🧪 Testando autenticação...\n');

  try {
    // Testar login com CEO
    console.log('Tentando login com CEO...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'ceo@empresa.com',
      password: '123456789'
    });

    if (error) {
      console.error('❌ Erro no login:', error.message);
      console.error('Código:', error.status);
      console.error('Detalhes:', error);
    } else {
      console.log('✅ Login bem-sucedido!');
      console.log('Usuário:', data.user.email);
      console.log('ID:', data.user.id);
    }
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testAuth();