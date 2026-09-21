import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Vitest configuration.
 *
 * The `obsidian` package has no npm-installable runtime module, so it is
 * aliased to a lightweight test double under tests/mocks/obsidian.ts. This lets
 * modules that import from "obsidian" (e.g. the template resolver) be unit
 * tested in Node without the Obsidian app.
 */
export default defineConfig({
	resolve: {
		alias: {
			obsidian: path.resolve(__dirname, "tests/mocks/obsidian.ts"),
		},
	},
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts"],
	},
});
