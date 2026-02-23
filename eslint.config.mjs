import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginImport from "eslint-plugin-import";
import tseslint from "typescript-eslint";

const config = [
  ...nextCoreWebVitals,
  eslintConfigPrettier,
  {
    plugins: {
      import: eslintPluginImport,
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling"],
          "newlines-between": "always",
          alphabetize: { order: "asc" },
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    ignores: [
      "scripts/**",
      "cypress/**",
      "update-*.js",
      "verify-*.js",
      "translate-*.js",
      "fix-*.js",
      "playwright-report/**",
      "test-results/**",
    ],
  },
];

export default config;
