/**
 * Minimal test double for the parts of the `obsidian` API used by the plugin.
 *
 * Only the surface exercised by unit-tested modules is implemented. The real
 * `obsidian` module is provided by the app at runtime and is not installable as
 * a standalone runtime dependency, so tests alias "obsidian" to this file.
 */

/**
 * Stand-in for Obsidian's abstract file base class.
 */
export class TAbstractFile {
	/** Vault-relative path of the file. */
	path = "";
}

/**
 * Stand-in for Obsidian's TFile, sufficient for `instanceof` checks and paths.
 */
export class TFile extends TAbstractFile {
	/** Basename without extension. */
	basename = "";
	/** File extension without the dot. */
	extension = "";
}

/**
 * Normalizes a vault path by collapsing duplicate slashes and trimming edges.
 *
 * Mirrors the observable behavior of Obsidian's `normalizePath` closely enough
 * for path-resolution tests.
 *
 * @param path - The raw path to normalize.
 * @returns The normalized path.
 */
export function normalizePath(path: string): string {
	return path.replace(/\\/g, "/").replace(/\/{2,}/g, "/").replace(/^\/+|\/+$/g, "");
}

/** Placeholder types referenced by imports; unused in unit tests. */
export class App {}
export class Plugin {}
export class PluginSettingTab {}
export class Setting {}
export class MarkdownRenderChild {}
export interface MarkdownPostProcessorContext {
	sourcePath: string;
	addChild(child: unknown): void;
}
