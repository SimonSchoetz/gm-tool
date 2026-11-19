import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// Tests of Node tooling (the dev data server, the ESLint rules, the repository-root scripts) load native modules and the bundler, whose globals differ from a VM context's (`instanceof Error` fails across them), so they stay on the default `forks` pool.
const nodeToolingTests = [
  'dev-data-server/**/*.test.ts',
  'eslint-rules/**/*.test.js',
  '../scripts/**/*.test.ts',
];

export default defineConfig({
  plugins: [react()],
  // The tests of the repository-root `scripts/` live outside this root; the dev server serves them only when it may read the parent directory.
  server: { fs: { allow: ['..'] } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    css: true,
    // `pnpm run mutation-check` writes sandbox copies of the app under `.stryker-tmp`; a run beside it would collect their test files too. Setting `exclude` replaces Vitest's defaults, hence the spread.
    exclude: [...configDefaults.exclude, '.stryker-tmp/**'],
    projects: [
      {
        extends: true,
        test: { name: 'node-tooling', include: nodeToolingTests },
      },
      // `vmThreads` builds the jsdom environment once per worker and still gives each file a fresh VM context and `window`, where `forks` builds jsdom again for every file.
      {
        extends: true,
        test: {
          name: 'app',
          pool: 'vmThreads',
          include: configDefaults.include,
          exclude: nodeToolingTests,
        },
      },
    ],
    coverage: {
      include: [
        'src/**/*.{ts,tsx}',
        'services/**/*.ts',
        'domain/**/*.ts',
        'db/**/*.ts',
        'util/**/*.ts',
        'platform/**/*.ts',
        'dev-data-server/**/*.ts',
      ],
      // Type declarations and the generated route tree carry no statements of their own, so counting them would only deflate the report.
      exclude: ['**/__tests__/**', '**/*.d.ts', 'src/routeTree.gen.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@db': path.resolve(import.meta.dirname, './db'),
      '@util': path.resolve(import.meta.dirname, './util'),
      '@services': path.resolve(import.meta.dirname, './services'),
      '@domain': path.resolve(import.meta.dirname, './domain'),
      '@platform': path.resolve(import.meta.dirname, './platform'),
    },
  },
});
