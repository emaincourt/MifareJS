module.exports = {
  parser: 'babel-eslint',
  extends: 'airbnb',
  env: {
    node: true,
    'jest/globals': true,
  },
  plugins: [
    'jest',
  ],
};
