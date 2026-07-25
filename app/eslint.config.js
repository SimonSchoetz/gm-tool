// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import { reactRefresh } from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import noWrappedLineComments from './eslint-rules/no-wrapped-line-comments.js';

export default defineConfig(
  { ignores: ['dist/**', 'src-tauri/**', 'coverage/**'] },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['lucide-react.d.ts'],
        },
      },
    },
    plugins: {
      local: { rules: { 'no-wrapped-line-comments': noWrappedLineComments } },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Use "as const" objects instead of enums.',
        },
      ],
      'local/no-wrapped-line-comments': 'warn',
    },
  },
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite(),
  {
    files: ['*.js', '*.mjs', '*.cjs', 'eslint-rules/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['vite.config.ts', 'vitest.config.ts'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
