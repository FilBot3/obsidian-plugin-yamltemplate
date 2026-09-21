import { App, TFile, normalizePath } from "obsidian";

/**
 * A resolved template: the file it came from and the extracted template body.
 */
export interface ResolvedTemplate {
	/** The vault file the template was resolved from. */
	file: TFile;
	/** The Handlebars template source (an html/handlebars fenced block, or the whole body). */
	source: string;
}

/** Ordered filename suffixes tried when resolving a template name to a file. */
const TEMPLATE_SUFFIXES = [".md", ".html.md", ".html"] as const;

/**
 * Matches the first fenced ```html or ```handlebars (or ```hbs) code block in a document.
 *
 * Capture group 1 is the block body. The opening fence language is matched
 * case-insensitively; the closing fence is a line consisting only of ```.
 */
const FENCED_TEMPLATE_BLOCK =
	/^[^\S\r\n]*```(?:html|handlebars|hbs)[^\S\r\n]*\r?\n([\s\S]*?)\r?\n[^\S\r\n]*```[^\S\r\n]*$/im;

/** Matches a leading YAML frontmatter block so it can be stripped from raw bodies. */
const FRONTMATTER_BLOCK = /^\uFEFF?---\r?\n[\s\S]*?\r?\n---[^\S\r\n]*\r?\n?/;

/**
 * Resolves and loads a template by name from the configured templates folder.
 *
 * The name is looked up as `{name}.md`, `{name}.html.md`, then `{name}.html`
 * within `templatesFolder`. For the returned file, the template body is the
 * first fenced html/handlebars block if present, otherwise the whole file body
 * with any leading frontmatter removed.
 *
 * @param app - The Obsidian app instance.
 * @param templatesFolder - Vault-relative folder to resolve the name within.
 * @param name - The template name from a block's `template` key.
 * @returns The resolved template, or null if no matching file exists.
 * @throws Error
 *     If a matching file exists but cannot be read.
 */
export async function resolveTemplate(
	app: App,
	templatesFolder: string,
	name: string,
): Promise<ResolvedTemplate | null> {
	const file = findTemplateFile(app, templatesFolder, name);
	if (!file) {
		return null;
	}

	const raw = await app.vault.cachedRead(file);
	return { file, source: extractTemplateSource(raw) };
}

/**
 * Finds the template file for a name by trying the known suffixes in order.
 *
 * @param app - The Obsidian app instance.
 * @param templatesFolder - Vault-relative folder to resolve the name within.
 * @param name - The template name from a block's `template` key.
 * @returns The first matching file, or null if none exist.
 */
export function findTemplateFile(app: App, templatesFolder: string, name: string): TFile | null {
	const trimmed = name.trim();
	if (trimmed.length === 0) {
		return null;
	}

	// Allow the name to already include one of the known suffixes.
	const candidates = hasKnownSuffix(trimmed)
		? [trimmed]
		: TEMPLATE_SUFFIXES.map((suffix) => `${trimmed}${suffix}`);

	for (const candidate of candidates) {
		const path = joinPath(templatesFolder, candidate);
		const file = app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) {
			return file;
		}
	}

	return null;
}

/**
 * Extracts the template body from a raw file's contents.
 *
 * @param raw - The full text content of a template file.
 * @returns The first fenced html/handlebars block body, or the whole body with
 *     any leading frontmatter stripped.
 */
export function extractTemplateSource(raw: string): string {
	const fenced = FENCED_TEMPLATE_BLOCK.exec(raw);
	if (fenced && fenced[1] !== undefined) {
		return fenced[1];
	}

	return raw.replace(FRONTMATTER_BLOCK, "").trim();
}

/**
 * Reports whether a candidate name already ends with a known template suffix.
 *
 * @param name - The candidate template name.
 * @returns True if the name ends with .md, .html.md, or .html.
 */
function hasKnownSuffix(name: string): boolean {
	const lower = name.toLowerCase();
	return TEMPLATE_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}

/**
 * Joins a folder and a filename into a normalized vault path.
 *
 * @param folder - The vault-relative folder (may be empty for the vault root).
 * @param file - The filename to place inside the folder.
 * @returns The normalized vault path.
 */
function joinPath(folder: string, file: string): string {
	const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
	return normalizePath(cleanFolder.length === 0 ? file : `${cleanFolder}/${file}`);
}
