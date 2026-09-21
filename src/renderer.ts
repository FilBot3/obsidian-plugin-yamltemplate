import Handlebars from "handlebars";
import { load as parseYaml } from "js-yaml";

/**
 * The parsed contents of a yamltemplate code block.
 */
export interface ParsedBlock {
	/** The template name from the `template` key, or null if absent. */
	templateName: string | null;
	/** The data object passed to the template. */
	data: Record<string, unknown>;
}

/** Keys that are treated as block directives rather than template data. */
const RESERVED_KEYS = new Set(["template"]);

/** Tags removed entirely (including their contents) during sanitization. */
const DANGEROUS_TAGS = /<\s*(script|iframe|object|embed|link|meta|style|base)\b[\s\S]*?<\s*\/\s*\1\s*>/gi;

/** Self-closing/void dangerous tags removed during sanitization. */
const DANGEROUS_VOID_TAGS = /<\s*(script|iframe|object|embed|link|meta|base)\b[^>]*\/?\s*>/gi;

/** Inline event handler attributes (onclick, onload, ...) removed during sanitization. */
const EVENT_HANDLER_ATTRS = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;

/** javascript: URIs in href/src attributes removed during sanitization. */
const JS_URI_ATTRS = /\s+(href|src|xlink:href)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]+)/gi;

/**
 * A shared Handlebars environment with the plugin's built-in helpers registered.
 *
 * Handlebars compiles templates without `eval`/`new Function`, so it is safe
 * under Obsidian's mobile content security policy.
 */
const handlebars = Handlebars.create();
registerBuiltinHelpers(handlebars);

/**
 * Parses a yamltemplate code block's YAML into a template name and data object.
 *
 * The `template` key (if present) selects the template; every other top-level
 * key becomes template data. A nested `data:` mapping, if present, is merged in
 * and takes precedence over sibling keys.
 *
 * @param blockSource - The raw text inside the yamltemplate fenced block.
 * @returns The parsed template name and data.
 * @throws Error
 *     If the block is not valid YAML or does not describe a mapping.
 */
export function parseBlock(blockSource: string): ParsedBlock {
	const trimmed = blockSource.trim();
	const loaded = trimmed.length === 0 ? {} : parseYaml(trimmed);

	if (loaded === null || loaded === undefined) {
		return { templateName: null, data: {} };
	}

	if (typeof loaded !== "object" || Array.isArray(loaded)) {
		throw new Error("A yamltemplate block must contain a YAML mapping (key: value pairs).");
	}

	const record = loaded as Record<string, unknown>;
	const rawTemplate = record["template"];
	const templateName =
		typeof rawTemplate === "string" && rawTemplate.trim().length > 0 ? rawTemplate.trim() : null;

	const data: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(record)) {
		if (!RESERVED_KEYS.has(key)) {
			data[key] = value;
		}
	}

	// An explicit `data:` mapping merges in and overrides sibling keys.
	const nested = record["data"];
	if (nested !== undefined) {
		delete data["data"];
		if (nested !== null && typeof nested === "object" && !Array.isArray(nested)) {
			Object.assign(data, nested as Record<string, unknown>);
		}
	}

	return { templateName, data };
}

/**
 * Compiles a Handlebars template source and applies data to produce HTML.
 *
 * @param templateSource - The Handlebars template body.
 * @param data - The data object to apply to the template.
 * @returns The rendered HTML string.
 * @throws Error
 *     If the template fails to compile or render.
 */
export function renderTemplate(templateSource: string, data: Record<string, unknown>): string {
	const compiled = handlebars.compile(templateSource, { noEscape: false });
	return compiled(data);
}

/**
 * Removes scripts, dangerous tags, inline event handlers, and javascript: URIs.
 *
 * This is a conservative string-level sanitizer intended as defense in depth
 * for template output. It is not a full HTML parser; it errs toward stripping.
 *
 * @param html - The rendered HTML to sanitize.
 * @returns The sanitized HTML.
 */
export function sanitizeHtml(html: string): string {
	return html
		.replace(DANGEROUS_TAGS, "")
		.replace(DANGEROUS_VOID_TAGS, "")
		.replace(EVENT_HANDLER_ATTRS, "")
		.replace(JS_URI_ATTRS, "");
}

/**
 * Registers the plugin's built-in Handlebars helpers on an environment.
 *
 * Helpers:
 * - `join`: joins an array with a separator (default ", ").
 * - `upper` / `lower`: upper/lower-cases a value.
 * - `json`: serializes a value as pretty-printed JSON.
 * - `default`: returns the value, or a fallback when it is null/undefined/empty.
 * - `eq` / `ne`: loose equality / inequality, for use in `{{#if (eq a b)}}`.
 * - `gt` / `lt`: numeric greater-than / less-than comparisons.
 * - `range`: produces an inclusive array of integers from start to end.
 * - `add` / `subtract`: numeric addition / subtraction.
 *
 * @param env - The Handlebars environment to register helpers on.
 */
function registerBuiltinHelpers(env: typeof Handlebars): void {
	env.registerHelper("join", (value: unknown, separator: unknown) => {
		const sep = typeof separator === "string" ? separator : ", ";
		return Array.isArray(value) ? value.join(sep) : String(value ?? "");
	});

	env.registerHelper("upper", (value: unknown) => String(value ?? "").toUpperCase());

	env.registerHelper("lower", (value: unknown) => String(value ?? "").toLowerCase());

	env.registerHelper("json", (value: unknown) => JSON.stringify(value, null, 2));

	env.registerHelper("default", (value: unknown, fallback: unknown) => {
		const isEmpty = value === null || value === undefined || value === "";
		return isEmpty ? fallback : value;
	});

	env.registerHelper("eq", (a: unknown, b: unknown) => looseEquals(a, b));

	env.registerHelper("ne", (a: unknown, b: unknown) => !looseEquals(a, b));

	env.registerHelper("gt", (a: unknown, b: unknown) => Number(a) > Number(b));

	env.registerHelper("lt", (a: unknown, b: unknown) => Number(a) < Number(b));

	env.registerHelper("range", (start: unknown, end: unknown) => {
		const from = Math.trunc(Number(start));
		const to = Math.trunc(Number(end));
		if (!Number.isFinite(from) || !Number.isFinite(to)) {
			return [];
		}
		const result: number[] = [];
		if (from <= to) {
			for (let i = from; i <= to; i += 1) {
				result.push(i);
			}
		} else {
			for (let i = from; i >= to; i -= 1) {
				result.push(i);
			}
		}
		return result;
	});

	env.registerHelper("add", (a: unknown, b: unknown) => Number(a) + Number(b));

	env.registerHelper("subtract", (a: unknown, b: unknown) => Number(a) - Number(b));
}

/**
 * Compares two values for template-friendly equality.
 *
 * Values are compared by their string form so that YAML numbers and quoted
 * strings (e.g. `200` and `"200"`) match, which is the intuitive behavior in a
 * template `{{#if (eq a b)}}` check.
 *
 * @param a - The first value.
 * @param b - The second value.
 * @returns True if the two values are equal by string form.
 */
function looseEquals(a: unknown, b: unknown): boolean {
	if (a === b) {
		return true;
	}
	if (a === null || a === undefined || b === null || b === undefined) {
		return false;
	}
	return String(a) === String(b);
}
