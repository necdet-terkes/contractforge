/* eslint-env node */
module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: ["@typescript-eslint", "react", "react-hooks", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:prettier/recommended",
    "eslint-config-prettier"
  ],
  settings: {
    react: {
      version: "detect"
    }
  },
  rules: {
    "prettier/prettier": "warn",
    "no-console": [
      "warn",
      {
        allow: ["warn", "error", "info"]
      }
    ],
    "react/react-in-jsx-scope": "off"
  },
  overrides: [
    {
      files: ["ui-app/**/*.{ts,tsx,js,jsx}"],
      env: {
        browser: true,
        node: true
      }
    }
  ]
};
