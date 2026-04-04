// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import { reactRefresh } from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['dist/**', 'src-tauri/**', 'coverage/**'] },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use "as const" objects instead of enums.',
        },
      ],
    },
  },
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite(),
  {
    files: ['*.js', '*.mjs', '*.cjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['vite.config.ts', 'vitest.config.ts'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
