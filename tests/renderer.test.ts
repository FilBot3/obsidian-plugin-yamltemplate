import { describe, expect, it } from "vitest";

import { parseBlock, renderTemplate, sanitizeHtml } from "../src/renderer";

describe("parseBlock", () => {
	it("extracts the template name and treats other keys as data", () => {
		const result = parseBlock("template: person-card\nname: Jane\nrole: Engineer");
		expect(result.templateName).toBe("person-card");
		expect(result.data).toEqual({ name: "Jane", role: "Engineer" });
	});

	it("returns a null template name when the key is absent", () => {
		const result = parseBlock("name: Jane");
		expect(result.templateName).toBeNull();
		expect(result.data).toEqual({ name: "Jane" });
	});

	it("does not leak the template key into data", () => {
		const result = parseBlock("template: t\nvalue: 1");
		expect(result.data).not.toHaveProperty("template");
	});

	it("merges a nested data mapping and lets it override siblings", () => {
		const result = parseBlock("template: t\nname: Sibling\ndata:\n  name: Nested\n  extra: 2");
		expect(result.data).toEqual({ name: "Nested", extra: 2 });
	});

	it("treats an empty block as no template and empty data", () => {
		const result = parseBlock("   ");
		expect(result.templateName).toBeNull();
		expect(result.data).toEqual({});
	});

	it("preserves list and nested-object values", () => {
		const result = parseBlock("template: t\nskills: [a, b]\nmeta:\n  active: true");
		expect(result.data).toEqual({ skills: ["a", "b"], meta: { active: true } });
	});

	it("throws when the block is a YAML sequence, not a mapping", () => {
		expect(() => parseBlock("- one\n- two")).toThrow(/mapping/i);
	});

	it("throws on invalid YAML", () => {
		expect(() => parseBlock("key: : :\n  - broken")).toThrow();
	});
});

describe("renderTemplate", () => {
	it("substitutes simple values", () => {
		expect(renderTemplate("<p>{{name}}</p>", { name: "Jane" })).toBe("<p>Jane</p>");
	});

	it("iterates arrays with each", () => {
		const html = renderTemplate("{{#each xs}}<li>{{this}}</li>{{/each}}", { xs: [1, 2] });
		expect(html).toBe("<li>1</li><li>2</li>");
	});

	it("HTML-escapes values by default", () => {
		const html = renderTemplate("<p>{{v}}</p>", { v: "<b>x</b>" });
		expect(html).toBe("<p>&lt;b&gt;x&lt;/b&gt;</p>");
	});

	it("supports the join helper", () => {
		expect(renderTemplate("{{join xs \", \"}}", { xs: ["a", "b"] })).toBe("a, b");
	});

	it("supports the default helper for empty values", () => {
		expect(renderTemplate("{{default v \"none\"}}", { v: "" })).toBe("none");
		expect(renderTemplate("{{default v \"none\"}}", { v: "set" })).toBe("set");
	});

	it("supports upper and lower helpers", () => {
		expect(renderTemplate("{{upper v}}", { v: "hi" })).toBe("HI");
		expect(renderTemplate("{{lower v}}", { v: "HI" })).toBe("hi");
	});

	it("supports eq in an if subexpression", () => {
		const tpl = '{{#if (eq s "on")}}yes{{else}}no{{/if}}';
		expect(renderTemplate(tpl, { s: "on" })).toBe("yes");
		expect(renderTemplate(tpl, { s: "off" })).toBe("no");
	});

	it("supports ne, gt, and lt helpers", () => {
		expect(renderTemplate('{{#if (ne a b)}}x{{/if}}', { a: 1, b: 2 })).toBe("x");
		expect(renderTemplate('{{#if (gt a b)}}x{{/if}}', { a: 5, b: 2 })).toBe("x");
		expect(renderTemplate('{{#if (lt a b)}}x{{/if}}', { a: 1, b: 2 })).toBe("x");
	});

	it("supports range, add, and subtract helpers", () => {
		expect(renderTemplate("{{#each (range 1 3)}}{{this}}{{/each}}", {})).toBe("123");
		expect(renderTemplate("{{add a b}}", { a: 2, b: 3 })).toBe("5");
		expect(renderTemplate("{{subtract a b}}", { a: 5, b: 2 })).toBe("3");
	});

	it("supports gte and lte helpers", () => {
		expect(renderTemplate('{{#if (gte a b)}}x{{/if}}', { a: 2, b: 2 })).toBe("x");
		expect(renderTemplate('{{#if (gte a b)}}x{{/if}}', { a: 3, b: 2 })).toBe("x");
		expect(renderTemplate('{{#if (lte a b)}}x{{/if}}', { a: 2, b: 2 })).toBe("x");
		expect(renderTemplate('{{#if (lte a b)}}x{{/if}}', { a: 1, b: 2 })).toBe("x");
	});

	it("supports and, or, and not helpers", () => {
		expect(renderTemplate('{{#if (and a b)}}x{{/if}}', { a: true, b: true })).toBe("x");
		expect(renderTemplate('{{#if (and a b)}}x{{else}}n{{/if}}', { a: true, b: false })).toBe("n");
		expect(renderTemplate('{{#if (or a b)}}x{{/if}}', { a: false, b: true })).toBe("x");
		expect(renderTemplate('{{#if (not a)}}x{{/if}}', { a: false })).toBe("x");
	});

	it("treats empty arrays as falsy in boolean helpers", () => {
		expect(renderTemplate('{{#if (not xs)}}empty{{/if}}', { xs: [] })).toBe("empty");
		expect(renderTemplate('{{#if (and xs 1)}}x{{else}}n{{/if}}', { xs: [] })).toBe("n");
	});

	it("supports multiply, divide, and mod helpers", () => {
		expect(renderTemplate("{{multiply a b}}", { a: 4, b: 3 })).toBe("12");
		expect(renderTemplate("{{divide a b}}", { a: 12, b: 4 })).toBe("3");
		expect(renderTemplate("{{mod a b}}", { a: 7, b: 3 })).toBe("1");
	});

	it("supports capitalize and length helpers", () => {
		expect(renderTemplate("{{capitalize v}}", { v: "hello" })).toBe("Hello");
		expect(renderTemplate("{{capitalize v}}", { v: "" })).toBe("");
		expect(renderTemplate("{{length xs}}", { xs: [1, 2, 3] })).toBe("3");
		expect(renderTemplate("{{length s}}", { s: "abc" })).toBe("3");
	});

	it("uses mod for zebra-striping via each index", () => {
		const tpl = "{{#each xs}}{{#if (eq (mod @index 2) 0)}}even{{else}}odd{{/if}};{{/each}}";
		expect(renderTemplate(tpl, { xs: ["a", "b", "c"] })).toBe("even;odd;even;");
	});

	it("looks up an array item by a computed index", () => {
		const tpl = "{{#each (range 1 2)}}{{lookup ../xs (subtract this 1)}};{{/each}}";
		expect(renderTemplate(tpl, { xs: ["a", "b"] })).toBe("a;b;");
	});

	it("throws on a malformed template", () => {
		expect(() => renderTemplate("{{#each}}", {})).toThrow();
	});
});

describe("sanitizeHtml", () => {
	it("removes script blocks", () => {
		expect(sanitizeHtml("<p>ok</p><script>alert(1)</script>")).toBe("<p>ok</p>");
	});

	it("removes iframes", () => {
		expect(sanitizeHtml('<iframe src="evil"></iframe><p>ok</p>')).toBe("<p>ok</p>");
	});

	it("strips inline event handlers", () => {
		expect(sanitizeHtml('<div onclick="steal()">x</div>')).toBe("<div>x</div>");
	});

	it("strips javascript: URIs", () => {
		expect(sanitizeHtml('<a href="javascript:evil()">x</a>')).toBe("<a>x</a>");
	});

	it("removes self-closing dangerous void tags", () => {
		expect(sanitizeHtml('<meta http-equiv="refresh"><p>ok</p>')).toBe("<p>ok</p>");
	});

	it("leaves safe markup untouched", () => {
		const safe = '<div class="card"><h2>Title</h2><a href="https://x.example">link</a></div>';
		expect(sanitizeHtml(safe)).toBe(safe);
	});
});
