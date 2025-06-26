import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      // Allow unused vars that start with underscore
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      // Allow any type in development
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow empty functions
      '@typescript-eslint/no-empty-function': 'off',
      // Allow require statements
      '@typescript-eslint/no-var-requires': 'off',
      // Disable Function type restriction for callbacks
      '@typescript-eslint/no-unsafe-function-type': 'off',
      // Allow prototype methods
      'no-prototype-builtins': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Allow require in JS files
      'no-undef': 'off',
    },
  },
  {
    files: ['**/*.test.{js,ts,tsx}', '**/__tests__/**/*.{js,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '.next/',
      '.turbo/',
      'coverage/',
      '*.config.js',
      '*.config.mjs',
      '.local/',
      'apps/tracking/dist/',
      'apps/web/.next/',
      'apps/api/dist/',
    ],
  },
];
