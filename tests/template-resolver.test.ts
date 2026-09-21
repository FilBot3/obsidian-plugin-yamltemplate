import { describe, expect, it } from "vitest";

import { extractTemplateSource } from "../src/template-resolver";

describe("extractTemplateSource", () => {
	it("extracts the first fenced html block", () => {
		const raw = ["# Docs", "", "```html", "<p>{{name}}</p>", "```", ""].join("\n");
		expect(extractTemplateSource(raw)).toBe("<p>{{name}}</p>");
	});

	it("extracts a handlebars-tagged block", () => {
		const raw = ["```handlebars", "<h2>{{title}}</h2>", "```"].join("\n");
		expect(extractTemplateSource(raw)).toBe("<h2>{{title}}</h2>");
	});

	it("extracts an hbs-tagged block", () => {
		const raw = ["```hbs", "<span>{{x}}</span>", "```"].join("\n");
		expect(extractTemplateSource(raw)).toBe("<span>{{x}}</span>");
	});

	it("takes only the first fenced block when several exist", () => {
		const raw = [
			"```html",
			"<p>first</p>",
			"```",
			"",
			"```html",
			"<p>second</p>",
			"```",
		].join("\n");
		expect(extractTemplateSource(raw)).toBe("<p>first</p>");
	});

	it("preserves multi-line block contents", () => {
		const raw = ["```html", "<ul>", "  <li>{{a}}</li>", "</ul>", "```"].join("\n");
		expect(extractTemplateSource(raw)).toBe("<ul>\n  <li>{{a}}</li>\n</ul>");
	});

	it("falls back to the whole body when there is no fenced block", () => {
		expect(extractTemplateSource("<p>plain</p>")).toBe("<p>plain</p>");
	});

	it("strips leading frontmatter from the fallback body", () => {
		const raw = ["---", "title: T", "---", "", "<p>body</p>"].join("\n");
		expect(extractTemplateSource(raw)).toBe("<p>body</p>");
	});

	it("ignores non-template fenced blocks in the fallback path", () => {
		// A yamltemplate block is not a template source; whole body is used.
		const raw = ["```yamltemplate", "template: t", "```"].join("\n");
		const result = extractTemplateSource(raw);
		expect(result).toContain("```yamltemplate");
	});
});
