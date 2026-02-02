import { createClient } from '@supabase/supabase-js';

// Acesso seguro às variáveis de ambiente
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Verifica se as chaves existem e não são placeholders
export const isConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  !supabaseUrl.includes('placeholder');

if (!isConfigured) {
  console.warn("ATENÇÃO: Chaves do Supabase não encontradas. O App rodará em modo de DEMONSTRAÇÃO (Offline).");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);