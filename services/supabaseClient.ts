
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
} else {
  // Check de segurança (Log para desenvolvedor)
  console.log("Supabase Conectado. Certifique-se de ter rodado o script 'SUPABASE_SETUP.sql' no painel do Supabase para habilitar a segurança RLS.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
