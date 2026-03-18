import { createRequire } from 'module';

const requireFromHere = createRequire(import.meta.url);
const requireFromNext = createRequire(requireFromHere.resolve('eslint-config-next'));
const tsParser = requireFromNext('@typescript-eslint/parser');
const tsPlugin = requireFromNext('@typescript-eslint/eslint-plugin');
const nextPlugin = requireFromNext('@next/eslint-plugin-next');

const CODE_FILES = ['**/*.{js,mjs,cjs,ts,tsx}'];
const NEXT_FILES = ['src/**/*.{js,ts,tsx}', 'next.config.js'];

export default [
  {
    ignores: [
      '.next/**',
      'dist-scripts/**',
      'node_modules/**',
      'chrome-extension/lib/lottie.min.js',
    ],
  },
  {
    files: CODE_FILES,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: NEXT_FILES,
    plugins: nextPlugin.flatConfig.coreWebVitals.plugins,
    rules: nextPlugin.flatConfig.coreWebVitals.rules,
  },
];
