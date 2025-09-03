import js from '@eslint/js';
import globals from 'globals';
import tsEslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tsEslint.config(
  {
    plugins: {
      '@typescript-eslint': tsEslint.plugin,
      prettier: prettierPlugin,
    },
  },
  {
    ignores: ['node_modules', 'build'],
  },
  js.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
      parserOptions: {
        tsconfigRootDir: './tsconfig.json',
      },
    },
  },
  {
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 2,
      'prefer-const': 2,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-unused-vars': 1,
    },
    files: ['**/*.{js,ts}'],
  },
);