module.exports = {
  singleQuote: true,
  jsxSingleQuote: false,
  arrowParens: 'always',
  'max-len': ['error', 120, 2],
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  endOfLine: process.platform === 'win32' ? 'crlf' : 'lf',
};
