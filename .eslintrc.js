module.exports = {
  root: true,
  extends: [
    'airbnb',
    'airbnb-typescript',
    'plugin:@typescript-eslint/recommended',
    'plugin:json/recommended',
    'prettier',
    'plugin:markdown/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    extraFileExtensions: ['.json', '.md'],
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'unused-imports', 'promise'],
  ignorePatterns: ['.eslintrc.js', 'tests/*', '*.js'],
  rules: {
    '@typescript-eslint/default-param-last': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off', // Obvious evil, lots of such methods in our code
    '@typescript-eslint/lines-between-class-members': 'off',
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/no-inferrable-types': 'off', // No need to write like this: `let myBool: boolean = true;`
    '@typescript-eslint/no-non-null-assertion': 'off', // Suggested alternative is optional chaining and introducing an unwrap/expect function that would throw a runtime exception. `unwrap(optional: T | null | undefined): T`
    '@typescript-eslint/no-redeclare': 'off',
    '@typescript-eslint/no-throw-literal': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
    '@typescript-eslint/no-unused-vars': 'off', // Unused variables potentially indicate a bug. Underscore where needed.
    '@typescript-eslint/no-explicit-any': 'off', // We use `any` for some cases, but we should be explicit about it.
    '@typescript-eslint/no-useless-constructor': 'off',
    '@typescript-eslint/object-curly-spacing': 'off',
    '@typescript-eslint/return-await': 'off',
    'array-callback-return': 'off',
    'class-methods-use-this': 'off',
    'consistent-return': 'off',
    'default-case': 'off',
    'func-names': 'off',
    'global-require': 'off',
    'guard-for-in': 'off', // The reasoning here is good enough: https://eslint.org/docs/rules/guard-for-in
    'import/extensions': 'off',
    'import/first': 'off',
    'import/newline-after-import': 'off',
    'import/no-cycle': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/no-duplicates': 'off',
    'import/no-import-module-exports': 'off',
    'import/no-mutable-exports': 'off',
    'import/no-named-as-default': 'off',
    'import/no-named-default': 'off',
    'import/no-useless-path-segments': 'off',
    'import/order': 'off',
    'import/prefer-default-export': 'off',
    'max-classes-per-file': 'off',
    'max-len': 'off',
    'new-cap': 'off',
    'no-alert': 'off',
    'no-await-in-loop': 'off',
    'no-buffer-constructor': 'off',
    'no-cond-assign': 'off',
    'no-continue': 'off',
    'no-else-return': 'off',
    'no-lone-blocks': 'off',
    'no-lonely-if': 'off',
    'no-multi-assign': 'off',
    'no-nested-ternary': 'off',
    'no-param-reassign': 'off',
    'no-path-concat': 'off',
    'no-promise-executor-return': 'off',
    'no-plusplus': 'off',
    'no-restricted-exports': 'off',
    'no-restricted-globals': 'off',
    'no-restricted-properties': 'off',
    'no-restricted-syntax': 'off',
    'no-return-assign': 'off',
    'no-template-curly-in-string': 'off',
    'no-underscore-dangle': 'off',
    'no-unneeded-ternary': 'off',
    'no-unsafe-optional-chaining': 'off',
    'no-useless-computed-key': 'off',
    'no-useless-escape': 'off', // Review regex expressions, suspecting this rule to produce false-positives
    'no-useless-rename': 'off',
    'no-useless-return': 'off',
    'no-void': 'off',
    'operator-assignment': 'off',
    'operator-linebreak': 'off',
    'prefer-arrow-callback': 'off',
    'prefer-destructuring': 'off',
    'prefer-exponentiation-operator': 'off',
    'prefer-promise-reject-errors': 'off',
    'prefer-regex-literals': 'off',
    'prefer-template': 'off',
    'symbol-description': 'off',
    yoda: 'off',

    // Disabled to accommodate ESLint version upgrade (07/2022) but should potentially
    // be reenabled and problems addressed
    'no-shadow': 'off',
    'no-loop-func': 'off',
    'no-return-await': 'off',
    'lines-between-class-members': 'off',
    'import/named': 'off',

    // Approved rules that we use to match the codebase to UD code style
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/explicit-member-accessibility': [
      'error',
      {
        accessibility: 'no-public',
      },
    ],
    '@typescript-eslint/indent': 'off', // Indentation is handled by Prettier
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-floating-promises': ['error', {ignoreVoid: true}], // Allows to explicitly discard the promise with `void` keyword
    '@typescript-eslint/no-loop-func': 'off',
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        checksVoidReturn: false,
      },
    ],
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/prefer-for-of': 'error',
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/prefer-literal-enum-member': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/unified-signatures': 'error',
    'arrow-body-style': 'off',
    curly: 'error',
    'dot-notation': 'error',
    eqeqeq: ['error', 'smart'],
    'id-blacklist': ['error', 'String', 'Boolean', 'Undefined'],
    'no-bitwise': 'error',
    'no-caller': 'error',
    'no-console': 'error',
    'no-constant-condition': ['error', {checkLoops: false}],
    'no-empty': [
      'error',
      {
        allowEmptyCatch: true,
      },
    ],
    'no-eval': 'error',
    'no-multiple-empty-lines': 'error',
    'no-new-wrappers': 'error',
    'no-prototype-builtins': 'off',
    'no-throw-literal': 'error',
    'no-unused-expressions': 'error',
    'object-shorthand': 'error',
    'one-var': ['error', 'never'],
    'promise/prefer-await-to-then': 'error',
    radix: 'error',
    'spaced-comment': 'error',
    'unused-imports/no-unused-imports': 'error',
    'tss-unused-classes/unused-classes': 'off',
    '@next/next/link-passhref': 'off',
    '@next/next/no-img-element': 'off',
    'jsx-a11y/alt-text': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/iframe-has-title': 'off',
    'jsx-a11y/label-has-associated-control': 'off',
    'jsx-a11y/no-noninteractive-element-interactions': 'off',
    'jsx-a11y/no-noninteractive-tabindex': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/tabindex-no-positive': 'off',
    'no-console': 2,
    'promise/prefer-await-to-then': 'off',
    'react/button-has-type': 'off',
    'react/destructuring-assignment': 'off',
    'react/function-component-definition': 'off',
    'react/no-invalid-html-attribute': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react-hooks/rules-of-hooks': 'off',
    'react/jsx-boolean-value': 'off',
    'react/jsx-curly-brace-presence': 'off',
    'react/jsx-fragments': 'off',
    'react/jsx-no-bind': 'off',
    'react/jsx-no-constructed-context-values': 'off',
    'react/jsx-no-duplicate-props': 'off',
    'react/jsx-no-useless-fragment': 'off',
    'react/jsx-pascal-case': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/no-array-index-key': 'off',
    'react/no-danger': 'off',
    'react/no-unstable-nested-components': 'off',
    'react/no-unused-prop-types': 'off',
    'react/require-default-props': 'off',
    'react/self-closing-comp': 'off',
    'react/state-in-constructor': 'off',
    'spaced-comment': 'off',
    'react/display-name': 'off',
    'react/prop-types': 'off',
    'import/no-duplicates': ['error'],
  },
};
