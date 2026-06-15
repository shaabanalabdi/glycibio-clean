import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"

// Configuration ESLint "flat" (ESLint 9) pour le front Vite + React 19.
// Manquait au depot : `npm run lint` (eslint .) echouait faute de config.
export default [
    { ignores: ["dist", "node_modules", "public"] },
    {
        files: ["**/*.{js,jsx}"],
        languageOptions: {
            ecmaVersion: 2022,
            globals: { ...globals.browser },
            parserOptions: {
                ecmaVersion: "latest",
                ecmaFeatures: { jsx: true },
                sourceType: "module"
            }
        },
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh
        },
        rules: {
            ...js.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            // Constantes exportees / destructuration "_" ignorees ; erreurs de
            // catch non bloquantes (le code utilise `catch { }`).
            "no-unused-vars": ["error", {
                varsIgnorePattern: "^[A-Z_]",
                argsIgnorePattern: "^_",
                caughtErrors: "none"
            }],
            "react-refresh/only-export-components": ["warn", { allowConstantExport: true }]
        }
    }
]
