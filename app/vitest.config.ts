import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    css: true,
    coverage: {
      include: [
        'src/**/*.{ts,tsx}',
        'services/**/*.ts',
        'domain/**/*.ts',
        'db/**/*.ts',
        'util/**/*.ts',
      ],
      // Type declarations and the generated route tree carry no statements of their own, so counting them would only deflate the report.
      exclude: ['**/__tests__/**', '**/*.d.ts', 'src/routeTree.gen.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@db': path.resolve(__dirname, './db'),
      '@util': path.resolve(__dirname, './util'),
      '@services': path.resolve(__dirname, './services'),
      '@domain': path.resolve(__dirname, './domain'),
    },
  },
});
