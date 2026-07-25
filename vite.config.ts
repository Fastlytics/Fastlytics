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
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'vendor-recharts';
            if (id.includes('d3-')) return 'vendor-recharts';
            if (id.includes('@sentry')) return 'vendor-sentry';
            if (id.includes('posthog')) return 'vendor-posthog';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('@tanstack/react-query')) return 'vendor-query';
            if (id.includes('@tanstack/react-table')) return 'vendor-table';
            if (id.includes('motion')) return 'vendor-motion';
            if (id.includes('@radix-ui')) return 'vendor-radix';
            if (id.includes('hugeicons')) return 'vendor-icons';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('react-dom')) return 'vendor-react';
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('@fortawesome')) return 'vendor-icons';
            return 'vendor';
          }
        },
      },
    },
  },
  plugins: [react(), tailwindcss()].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
