import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Recuperar variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação robusta das credenciais
if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL não está definido nas variáveis de ambiente');
  throw new Error('URL do Supabase não encontrado. Verifique o arquivo .env');
}

if (!supabaseKey) {
  console.error('VITE_SUPABASE_ANON_KEY não está definido nas variáveis de ambiente');
  throw new Error('Chave anônima do Supabase não encontrada. Verifique o arquivo .env');
}

// Criação do cliente com tratamento de erros
let supabaseInstance: SupabaseClient | null = null;

try {
  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'dentclinic-auth-storage-key',
    },
  });
  
  console.log('Cliente Supabase inicializado com sucesso');
} catch (error) {
  console.error('Erro ao inicializar o cliente Supabase:', error);
  throw new Error('Falha ao conectar com o Supabase. Verifique a conexão e credenciais.');
}

// Verificar conectividade básica
const testConnection = async () => {
  try {
    const { error } = await supabaseInstance?.from('profiles').select('count').limit(1).single() || {};
    if (error) {
      console.warn('Teste de conexão com o Supabase encontrou um erro:', error.message);
      // Não lançamos erro aqui para não bloquear a inicialização da aplicação
    } else {
      console.log('Conectividade com Supabase confirmada');
    }
  } catch (e) {
    console.warn('Erro ao testar conexão com Supabase:', e);
  }
};

// Testar conexão em background
testConnection();

export const supabase = supabaseInstance;