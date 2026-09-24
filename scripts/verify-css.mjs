// @ts-check
/**
 * Verify the generated styles.css satisfies the scoping and reduction
 * invariants. Exits non-zero (failing the build/CI) if any invariant is
 * violated. Run after css:build.
 *
 * Invariants:
 *   1. styles.css parses as valid CSS.
 *   2. No bare element/global selectors survive from W3.CSS's normalize block
 *      or base rules (html, body, h1-h6, a, img, hr, button, input, *, [type=]).
 *      The only permitted top-level selectors are the plugin's own
 *      `.yamltemplate-*` rules and `.yamltemplate-rendered`-scoped rules.
 *   3. No denied/app-chrome families are present (w3-modal, w3-sidebar,
 *      w3-overlay, w3-top, w3-bottom, w3-dropdown, ...).
 *   4. Every W3.CSS rule (any selector containing a `.w3-` class) is scoped:
 *      each of its selectors starts with `.yamltemplate-rendered`.
 *
 * Usage: node scripts/verify-css.mjs
 */
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import postcss from "postcss";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const SCOPE = ".yamltemplate-rendered";

/** Selectors that must never appear as an unscoped top-level selector. */
const BARE_ELEMENT = /^(html|body|h[1-6]|a|img|hr|button|input|select|textarea|optgroup|fieldset|legend|figure|figcaption|article|aside|details|summary|audio|canvas|progress|video|abbr|b|strong|dfn|mark|small|sub|sup|code|kbd|pre|samp|nav|menu|header|footer|main|section|\*|\[)/i;

/** Denied families that must not be present at all. */
const DENY = [
	"w3-modal", "w3-sidebar", "w3-overlay", "w3-top", "w3-bottom", "w3-main",
	"w3-dropdown-hover", "w3-dropdown-click", "w3-dropdown-content",
	"w3-display", "w3-animate-top", "w3-animate-left", "w3-animate-right",
	"w3-animate-bottom",
];

/** Extract the `w3-...` class tokens referenced in a selector. */
function w3Classes(selector) {
	const out = [];
	const re = /\.(w3-[a-z0-9-]+)/gi;
	let m;
	while ((m = re.exec(selector)) !== null) {
		out.push(m[1].toLowerCase());
	}
	return out;
}

/** True if a denied family matches a class by exact name or `family-` prefix. */
function matchesDeny(cls) {
	return DENY.find((d) => cls === d || cls.startsWith(`${d}-`)) ?? null;
}

function fail(msg) {
	process.stderr.write(`css:verify FAIL - ${msg}\n`);
	process.exitCode = 1;
}

async function main() {
	const outPath = resolve(ROOT, "styles.css");
	const css = await readFile(outPath, "utf8");

	let root;
	try {
		root = postcss.parse(css, { from: outPath });
	} catch (err) {
		fail(`styles.css does not parse as valid CSS: ${err && err.message}`);
		return;
	}

	let checked = 0;
	let w3Scoped = 0;

	root.walkRules((rule) => {
		// Skip keyframe step selectors (from/to/percentages).
		if (rule.parent && rule.parent.type === "atrule" && /keyframes/i.test(rule.parent.name)) {
			return;
		}
		checked += 1;

		for (const sel of rule.selectors) {
			const s = sel.trim();

			// Invariant 2: no bare element/global selectors, unless scoped.
			if (!s.startsWith(SCOPE) && !s.startsWith(".yamltemplate-") && BARE_ELEMENT.test(s)) {
				fail(`unscoped bare/element selector leaked: "${s}"`);
			}

			// Invariant 3: no denied families anywhere.
			for (const cls of w3Classes(s)) {
				const hit = matchesDeny(cls);
				if (hit) {
					fail(`denied app-chrome family present: "${s}" (matches ${hit})`);
				}
			}

			// Invariant 4: any w3 rule must be scoped.
			if (/\.w3-/i.test(s)) {
				w3Scoped += 1;
				if (!s.startsWith(SCOPE)) {
					fail(`unscoped W3.CSS selector: "${s}"`);
				}
			}
		}
	});

	if (w3Scoped === 0) {
		fail("no scoped W3.CSS rules found - subset/scope step did not run?");
	}

	if (process.exitCode === 1) {
		process.stderr.write(`css:verify - checked ${checked} rules, found violations (see above)\n`);
		return;
	}

	process.stdout.write(
		`css:verify OK - ${checked} rules checked, ${w3Scoped} W3 selectors all scoped to ${SCOPE}, no leaks, no denied families\n`,
	);
}

main().catch((err) => {
	process.stderr.write(`css:verify errored: ${err && err.stack ? err.stack : err}\n`);
	process.exit(1);
});
