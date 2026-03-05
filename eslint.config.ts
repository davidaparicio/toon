// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu({
  pnpm: false,
  rules: {
    'no-cond-assign': 'off',
  },
}).append({
  files: ['README.md', 'SPEC.md', '**/docs/**/*'],
  rules: {
    'import/no-duplicates': 'off',
    'style/no-tabs': 'off',
    'yaml/quotes': 'off',
  },
})
