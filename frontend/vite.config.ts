import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 5173,
    open: true,
    proxy: {
      '/portal': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/content/preview': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/assets/public': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/content-plugins': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/content-editor': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/plugins': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/action': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
