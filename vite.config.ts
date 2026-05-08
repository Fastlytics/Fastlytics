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
    allowedHosts: ['fastlytics.app'], // Allow access from these hosts
  },
  plugins: [react(), tailwindcss()].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
