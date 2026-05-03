import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './private-tests/setupTests.ts',
    css: true,
    include: ['private-tests/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: [
      '**/node_modules/**',
      '**/.kilocode/**',
      '**/.agents/**',
      '**/dist/**',
      '**/build/**',
      '**/projects/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/App.tsx',
        'src/components/auth/ProtectedRoute.tsx',
        'src/components/common/FeatureGate.tsx',
        'src/components/common/GatedRoute.tsx',
        'src/components/replay/replay-utils.ts',
        'src/contexts/AuthContext.tsx',
        'src/lib/api-client.ts',
        'src/lib/api.ts',
        'src/lib/utils.ts',
        'src/pages/Dashboard.tsx',
        'src/pages/Race.tsx',
        'src/pages/SessionReplayPage.tsx',
        'src/types/error.types.ts',
      ],
      exclude: [
        'node_modules/',
        '**/*.config.{ts,js}',
        'src/**/*.d.ts',
        'private-tests/**',
        'src/main.tsx',
        '.kilocode/**',
      ],
      thresholds: {
        lines: 40,
        functions: 30,
        branches: 25,
        statements: 40,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './private-tests'),
    },
  },
});
