import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript + React files
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.jsx'],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },

    plugins: {
      '@typescript-eslint': tseslint,
    },

    rules: {
      'max-lines': [
        'error',
        {
          max: 250,
          skipBlankLines: true,
          skipComments: true,
        },
      ],

      // Minimal enterprise safety
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-unsafe-finally': 'off',

      // TypeScript correctness
      'no-unused-vars': 'off', // Disable base rule for TypeScript files
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  // Disable formatting rules (let Prettier handle formatting)
  prettier,
];
