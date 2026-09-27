import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base '/' para Vercel. Usar './' solo si se abre como archivo local.
export default defineConfig({
  plugins: [react()],
  base: '/'
});
