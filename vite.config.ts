import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    port: 8080,
    proxy:
      mode === 'development'
        ? {
            '/api': {
              target: 'http://localhost:8000',
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
