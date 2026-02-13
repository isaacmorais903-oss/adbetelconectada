
import { createClient } from '@supabase/supabase-js';

// =================================================================================
// NOTA DE SEGURANÇA:
// É seguro expor a URL e a ANON KEY no cliente (navegador), desde que o RLS
// (Row Level Security) esteja habilitado no banco de dados.
// NÃO adicione a 'service_role_key' aqui.
// =================================================================================

// Acesso seguro às variáveis de ambiente no Vite
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Verifica se as chaves existem e não são placeholders
export const isConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  !supabaseUrl.includes('placeholder');

if (!isConfigured) {
  console.warn("⚠️ MODO DEMONSTRAÇÃO: Chaves do Supabase não encontradas.");
  console.warn("Para conectar ao banco real, adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env ou nas variáveis da Vercel.");
}

// Cria o cliente apenas se as chaves existirem, senão cria um cliente 'dummy' para não quebrar o app
export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder');
