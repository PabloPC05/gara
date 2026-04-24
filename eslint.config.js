import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const reactRefreshPlugin = reactRefresh.default ?? reactRefresh;

const jsxFiles = ["**/*.{js,jsx}"];
const tsFiles = ["**/*.{ts,tsx}"];
const testFiles = [
	"src/**/*.{test,spec}.{js,jsx,ts,tsx}",
	"src/test/**/*.{js,jsx,ts,tsx}",
];

export default tseslint.config(
	{
		ignores: ["dist/**", "node_modules/**", ".next/**"],
	},
	js.configs.recommended,
	{
		files: jsxFiles,
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
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
		rules: {
			"no-unused-vars": "off",
			"react-refresh/only-export-components": "off",
		},
	},
	{
		files: tsFiles,
		extends: tseslint.configs.recommended,
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
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
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/ban-ts-comment": "off",
			"react-refresh/only-export-components": "off",
		},
	},
	{
		files: [...jsxFiles, ...tsFiles],
		plugins: {
			"react-hooks": reactHooks,
			"react-refresh": reactRefreshPlugin,
		},
		rules: {
			...reactHooks.configs.flat.recommended.rules,
			"react-hooks/exhaustive-deps": "off",
			"react-hooks/immutability": "off",
			"react-hooks/set-state-in-effect": "off",
			"react-refresh/only-export-components": "off",
		},
	},
	{
		files: testFiles,
		languageOptions: {
			globals: {
				...globals.vitest,
			},
		},
		rules: {
			"no-console": "off",
			"react-hooks/rules-of-hooks": "off",
			"react-hooks/exhaustive-deps": "off",
		},
	},
);
