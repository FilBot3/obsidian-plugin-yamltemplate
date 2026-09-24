// @ts-check
/**
 * Build the plugin's styles.css from two sources:
 *
 *   1. src/styles.base.css  - hand-written plugin rules (authoritative)
 *   2. vendor/w3.css        - pristine W3.CSS v5.01
 *
 * W3.CSS is *subset* (only an allowlist of class families is kept) and
 * *scoped* (every surviving selector is prefixed with `.yamltemplate-rendered`)
 * so it can only affect the plugin's rendered blocks and never leaks into the
 * rest of the Obsidian app. The two parts are concatenated into styles.css.
 *
 * styles.css is a GENERATED artifact. Do not edit it by hand: edit
 * src/styles.base.css or the allowlist/denylist below, then run
 * `npm run css:build`.
 *
 * Usage: node scripts/build-css.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import postcss from "postcss";
import prefixSelector from "postcss-prefix-selector";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

/** The container class every rendered block is injected into. */
const SCOPE = ".yamltemplate-rendered";

/**
 * W3.CSS class families to KEEP. A rule is kept only if at least one of its
 * selectors references one of these `w3-` classes. Prefixes are matched with a
 * word boundary so `w3-border` also matches `w3-border-blue`, `w3-border-top`,
 * etc.
 */
const ALLOW = [
	// Layout
	"w3-row", "w3-row-padding", "w3-col", "w3-half", "w3-third", "w3-twothird",
	"w3-quarter", "w3-threequarter", "w3-container", "w3-panel", "w3-cell",
	"w3-cell-row", "w3-grid", "w3-grid-padding", "w3-flex", "w3-content",
	"w3-auto", "w3-rest", "w3-block", "w3-stretch", "w3-responsive", "w3-clear",
	// Components
	"w3-card", "w3-badge", "w3-tag", "w3-btn", "w3-button", "w3-bar",
	"w3-bar-item", "w3-bar-block", "w3-table", "w3-table-all", "w3-striped",
	"w3-bordered", "w3-hoverable", "w3-centered", "w3-ul", "w3-code",
	"w3-codespan", "w3-image", "w3-tooltip",
	// Text / font
	"w3-serif", "w3-sans-serif", "w3-cursive", "w3-monospace", "w3-wide",
	"w3-text-center", "w3-text-bold", "w3-bold", "w3-text-italic", "w3-italic",
	"w3-left-align", "w3-right-align", "w3-justify", "w3-center",
	"w3-tiny", "w3-small", "w3-medium", "w3-large", "w3-xlarge", "w3-xxlarge",
	"w3-xxxlarge", "w3-jumbo",
	// Spacing / border / round
	"w3-margin", "w3-padding", "w3-section", "w3-border", "w3-topbar",
	"w3-bottombar", "w3-leftbar", "w3-rightbar", "w3-round", "w3-circle",
	"w3-left", "w3-right",
	// Effects
	"w3-opacity", "w3-greyscale", "w3-grayscale", "w3-sepia", "w3-hover-shadow",
	"w3-hover-opacity", "w3-hover-none", "w3-transparent", "w3-spin",
	"w3-animate-fading", "w3-animate-opacity", "w3-animate-zoom",
	// Display helpers (block-local)
	"w3-hide", "w3-show", "w3-show-block", "w3-show-inline-block",
	// Direction
	"w3-rtl", "w3-ltr",
	// Colors (backgrounds, text, borders, semantic) - broad families
	"w3-amber", "w3-aqua", "w3-blue", "w3-light-blue", "w3-brown", "w3-cyan",
	"w3-blue-grey", "w3-blue-gray", "w3-green", "w3-light-green", "w3-indigo",
	"w3-khaki", "w3-lime", "w3-orange", "w3-deep-orange", "w3-pink", "w3-purple",
	"w3-deep-purple", "w3-red", "w3-sand", "w3-teal", "w3-yellow", "w3-white",
	"w3-black", "w3-grey", "w3-gray", "w3-light-grey", "w3-light-gray",
	"w3-dark-grey", "w3-dark-gray", "w3-asphalt", "w3-crimson", "w3-cobalt",
	"w3-emerald", "w3-olive", "w3-paper", "w3-sienna", "w3-taupe", "w3-danger",
	"w3-note", "w3-info", "w3-warning", "w3-success", "w3-pale-red",
	"w3-pale-green", "w3-pale-yellow", "w3-pale-blue", "w3-text", "w3-hover",
];

/**
 * W3.CSS class families to explicitly DROP even if they would otherwise match
 * the allowlist. These are app-chrome / fixed-position components that either
 * do not make sense inside a note block or visually escape their container
 * even when their selector is scoped.
 */
const DENY = [
	"w3-modal", "w3-modal-content", "w3-sidebar", "w3-overlay", "w3-top",
	"w3-bottom", "w3-main", "w3-dropdown-hover", "w3-dropdown-click",
	"w3-dropdown-content", "w3-display", "w3-mobile", "w3-hide-small",
	"w3-hide-medium", "w3-hide-large", "w3-collapse", "w3-animate-top",
	"w3-animate-left", "w3-animate-right", "w3-animate-bottom",
	"w3-animate-input", "w3-input", "w3-select", "w3-check", "w3-radio",
	"w3-ripple",
];

/** Extract the `w3-...` class tokens referenced anywhere in a selector list. */
function w3Classes(selector) {
	const out = [];
	const re = /\.(w3-[a-z0-9-]+)/gi;
	let m;
	while ((m = re.exec(selector)) !== null) {
		out.push(m[1].toLowerCase());
	}
	return out;
}

/** True if any denied family matches one of the selector's w3 classes. */
function isDenied(classes) {
	return classes.some((cls) => DENY.some((d) => cls === d || cls.startsWith(`${d}-`)));
}

/** True if any allowed family matches one of the selector's w3 classes. */
function isAllowed(classes) {
	return classes.some((cls) => ALLOW.some((a) => cls === a || cls.startsWith(`${a}-`)));
}

/**
 * PostCSS plugin: remove any rule that does not reference an allowed (and
 * non-denied) w3 class. Rules with no w3 class at all (bare element selectors
 * like html/body/h1/a/*, normalize.css, [type=...]) are dropped outright.
 */
const subset = () => ({
	postcssPlugin: "w3-subset",
	Rule(rule) {
		// Keep keyframe steps (from/to/percent) intact; they are handled by
		// their parent atrule being kept or dropped.
		if (rule.parent && rule.parent.type === "atrule" && /keyframes/i.test(rule.parent.name)) {
			return;
		}
		const classes = w3Classes(rule.selector);
		if (classes.length === 0 || isDenied(classes) || !isAllowed(classes)) {
			rule.remove();
		}
	},
	OnceExit(root) {
		// Collect animation names still referenced by surviving declarations.
		const used = new Set();
		root.walkDecls(/^animation(-name)?$/i, (decl) => {
			// First whitespace-separated token that isn't a time/keyword is the
			// name; simplest robust approach is to record every token.
			for (const tok of decl.value.split(/[\s,]+/)) {
				if (tok) {
					used.add(tok);
				}
			}
		});

		// Drop @keyframes whose name is no longer referenced.
		root.walkAtRules(/keyframes/i, (at) => {
			if (!used.has(at.params)) {
				at.remove();
			}
		});

		// Drop now-empty at-rules (e.g. @media blocks emptied by subsetting).
		root.walkAtRules((at) => {
			if (at.nodes && at.nodes.length === 0) {
				at.remove();
			}
		});
	},
});
subset.postcss = true;

async function main() {
	const basePath = resolve(ROOT, "src/styles.base.css");
	const w3Path = resolve(ROOT, "vendor/w3.css");
	const outPath = resolve(ROOT, "styles.css");

	const [baseCss, w3Css] = await Promise.all([
		readFile(basePath, "utf8"),
		readFile(w3Path, "utf8"),
	]);

	const processed = await postcss([
		subset(),
		prefixSelector({
			prefix: SCOPE,
			// Do not prefix keyframe step selectors (from/to/0%). Everything
			// else (all class rules) gets the scope prefix.
			transform(prefix, selector, prefixedSelector, filePath, rule) {
				if (rule && rule.parent && rule.parent.type === "atrule" && /keyframes/i.test(rule.parent.name)) {
					return selector;
				}
				return prefixedSelector;
			},
		}),
	]).process(w3Css, { from: w3Path });

	const header = `/*
 * GENERATED FILE - do not edit by hand.
 * Sources: src/styles.base.css + vendor/w3.css (subset & scoped to ${SCOPE}).
 * Regenerate with: npm run css:build
 */
`;
	const w3Header = `\n/* --- W3.CSS v5.01 (subset, scoped to ${SCOPE}) --- */\n`;
	const output = `${header}\n${baseCss.trim()}\n${w3Header}${processed.css.trim()}\n`;

	await writeFile(outPath, output, "utf8");

	const ruleCount = (processed.css.match(/\{/g) || []).length;
	process.stdout.write(
		`css:build - wrote styles.css (${output.length} bytes, ~${ruleCount} scoped W3 rules)\n`,
	);
}

main().catch((err) => {
	process.stderr.write(`css:build failed: ${err && err.stack ? err.stack : err}\n`);
	process.exit(1);
});
