import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    port: 8080,
    allowedHosts: ['dev.fastlytics.app', 'localhost'],
    proxy:
      mode === 'development'
        ? {
            '/api': {
              target: 'https://fastlytics-api-proxy-v2.subhashgottumukkala17.workers.dev',
              changeOrigin: true,
            },
          }
        : undefined,
  },
  preview: {
    port: 8080,
    allowedHosts: ['fastlytics.app', 'dev.fastlytics.app'],
  },
  plugins: [react(), tailwindcss()].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
