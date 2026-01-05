import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Accesible desde la red local
    port: 5173,
    strictPort: true,
      // Añade esta línea para permitir el host de Cloudflare
    allowedHosts: [
      'attachment-topic-element-minutes.trycloudflare.com',
      '.trycloudflare.com' // Permite cualquier subdominio de Cloudflare
    ]
  },
});
