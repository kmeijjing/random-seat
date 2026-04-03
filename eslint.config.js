import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

const tsFiles = ['**/*.{ts,tsx}']

export default defineConfig(
  {
    ignores: ['dist', 'node_modules', 'vite.config.js', 'vite.config.d.ts', '*.tsbuildinfo'],
  },
  {
    ...js.configs.recommended,
    files: tsFiles,
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: tsFiles,
  })),
  {
    ...reactHooks.configs.flat.recommended,
    files: tsFiles,
  },
  {
    ...reactRefresh.configs.vite,
    files: tsFiles,
  },
  {
    files: tsFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
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
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/indent': ['error', 2],
      'react-hooks/set-state-in-effect': 'off',
    },
  },
)
