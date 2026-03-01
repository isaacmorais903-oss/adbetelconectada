
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Removemos o 'define: process.env' para segurança.
  // No Vite, variáveis de ambiente públicas devem começar com VITE_ e ser acessadas via import.meta.env
});
