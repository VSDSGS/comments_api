module.exports = {
  root: true,
  env: {
    node: true,
    commonjs: true,
    es2021: true,
    mocha: true,
  },
  plugins: ["prettier"],
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  parserOptions: {
    ecmaVersion: "latest",
  },
  ignorePatterns: [".eslintrc.js"],
  rules: { "prettier/prettier": ["error", { endOfLine: "auto" }] },
};
