import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente baseadas no modo (development/production)
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Define process.env para evitar erros de runtime, mas expõe apenas o necessário se desejar
      // Aqui passamos o env carregado para garantir que API_KEY esteja acessível
      'process.env': env
    }
  };
});