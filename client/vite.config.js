import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Per GitHub Pages il workflow imposta GH_PAGES_BASE="/campania-life/".
  base: process.env.GH_PAGES_BASE || '/',
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } }
  },
  build: { outDir: 'dist', sourcemap: true }
});
