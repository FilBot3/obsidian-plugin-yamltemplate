import { readFileSync } from "fs";
import path from "path";

import { describe, expect, it } from "vitest";

import { renderTemplate } from "../src/renderer";
import { extractTemplateSource } from "../src/template-resolver";

/**
 * End-to-end check on the shipped example template file: the html block is
 * extracted and renders as expected with the documented sample data. This
 * guards against the example drifting out of sync with the code.
 */
describe("examples/HTML Templates/person-card.md", () => {
	const raw = readFileSync(
		path.resolve(__dirname, "../examples/HTML Templates/person-card.md"),
		"utf8",
	);

	it("extracts the html block as the template body", () => {
		const source = extractTemplateSource(raw);
		expect(source).toContain("{{name}}");
		expect(source).toContain("{{#each skills}}");
		// The surrounding documentation must not leak into the template body.
		expect(source).not.toContain("# Person Card");
	});

	it("renders the extracted template with sample data", () => {
		const source = extractTemplateSource(raw);
		const html = renderTemplate(source, {
			name: "Jane Doe",
			role: "Staff Engineer",
			skills: ["Rust", "TypeScript"],
		});
		expect(html).toContain("<h2>Jane Doe</h2>");
		expect(html).toContain("Staff Engineer");
		expect(html).toContain("<li>Rust</li>");
		expect(html).toContain("<li>TypeScript</li>");
	});

	it("applies the default helper when role is empty", () => {
		const source = extractTemplateSource(raw);
		const html = renderTemplate(source, { name: "X", role: "", skills: [] });
		expect(html).toContain("—");
	});
});

describe("examples/HTML Templates/project-status.md", () => {
	const raw = readFileSync(
		path.resolve(__dirname, "../examples/HTML Templates/project-status.md"),
		"utf8",
	);

	it("extracts the html block as the template body", () => {
		const source = extractTemplateSource(raw);
		expect(source).toContain("{{#each tasks}}");
		expect(source).toContain('{{#if (eq status "on-track")}}');
		expect(source).not.toContain("# Project Status Card");
	});

	it("renders status, progress, tasks, and notes with sample data", () => {
		const source = extractTemplateSource(raw);
		const html = renderTemplate(source, {
			name: "Website Redesign",
			owner: "Web Team",
			status: "at-risk",
			percent: 60,
			tags: ["frontend", "q3"],
			tasks: [
				{ title: "Wireframes", state: "done" },
				{ title: "Content migration", state: "blocked" },
			],
			notes: "Waiting on the CMS export.",
		});
		expect(html).toContain("Website Redesign");
		expect(html).toContain("AT-RISK");
		expect(html).toContain("width:60%");
		expect(html).toContain("✅");
		expect(html).toContain("⛔");
		expect(html).toContain("frontend, q3");
		expect(html).toContain("Waiting on the CMS export.");
	});

	it("hides the notes block and defaults the owner when omitted", () => {
		const source = extractTemplateSource(raw);
		const html = renderTemplate(source, {
			name: "Minimal",
			status: "blocked",
			percent: 25,
			tasks: [{ title: "Start", state: "doing" }],
		});
		expect(html).toContain("Unassigned");
		expect(html).not.toContain("<strong>Notes:</strong>");
		expect(html).toContain("🔄");
	});
});

describe("examples/HTML Templates/knave-sheet.md", () => {
	const raw = readFileSync(
		path.resolve(__dirname, "../examples/HTML Templates/knave-sheet.md"),
		"utf8",
	);

	const character = {
		name: "Grimble Ashfoot",
		abilities: { str: 2, dex: 4, con: 1, int: 3, wis: 0, cha: 5 },
		careers: "Beggar, Cutpurse",
		description: "Wiry and quick.",
		level: 3,
		xp: 7,
		hp: { max: 9, current: 5 },
		armor: { points: 3, ac: 13 },
		maxItemSlots: 12,
		items: ["Dagger", "Torch (x3)", "Rope, 50ft"],
	};

	it("extracts the html block as the template body", () => {
		const source = extractTemplateSource(raw);
		expect(source).toContain("{{#each (range 1 20)}}");
		expect(source).not.toContain("# Knave 2e Character Sheet");
	});

	it("renders name, abilities, level, hp, and armor", () => {
		const html = renderTemplate(extractTemplateSource(raw), character);
		expect(html).toContain("Grimble Ashfoot");
		expect(html).toContain(">STR<");
		expect(html).toContain(">CHA<");
		expect(html).toContain("Beggar, Cutpurse");
	});

	it("renders 20 numbered item slots, filling the ones with items", () => {
		const html = renderTemplate(extractTemplateSource(raw), character);
		// All 20 slot numbers present.
		expect(html).toContain(">1</strong>");
		expect(html).toContain(">20</strong>");
		// First item name appears in slot 1.
		expect(html).toContain("Dagger");
		// A filled slot uses a black box; an empty slot is transparent.
		expect(html).toContain("background:#111;");
		expect(html).toContain("background:transparent;");
	});
});

describe("examples/HTML Templates/party-roster.md", () => {
	const raw = readFileSync(
		path.resolve(__dirname, "../examples/HTML Templates/party-roster.md"),
		"utf8",
	);

	const roster = {
		party: "The Ashfoot Company",
		members: [
			{
				name: "Grimble",
				role: "Cutpurse",
				abilities: { str: 2, dex: 4, con: 1, int: 3, wis: 0, cha: 5 },
				hp: { max: 9, current: 5 },
				inventory: [
					{ name: "Dagger", qty: 1 },
					{ name: "Torch", qty: 3 },
				],
			},
			{
				name: "Cassian",
				role: "Acolyte",
				abilities: { str: 3, dex: 1, con: 3, int: 2, wis: 5, cha: 2 },
				hp: { max: 10, current: 10 },
				inventory: [],
			},
		],
	};

	it("renders the shared party name and each member with nested abilities/hp", () => {
		const html = renderTemplate(extractTemplateSource(raw), roster);
		expect(html).toContain("The Ashfoot Company");
		expect(html).toContain("Grimble");
		expect(html).toContain("Cassian");
		expect(html).toContain("HP 5/9");
		expect(html).toContain("STR 2");
		expect(html).toContain("STR 3");
	});

	it("renders a nested inventory list with parent-scope and root access", () => {
		const html = renderTemplate(extractTemplateSource(raw), roster);
		// qty > 1 shows the multiplier; parent (../name) and @root.party resolve.
		expect(html).toContain("Torch ×3");
		expect(html).toContain("carried by Grimble (The Ashfoot Company)");
	});

	it("uses the each-else branch when a member has an empty inventory", () => {
		const html = renderTemplate(extractTemplateSource(raw), roster);
		expect(html).toContain("Empty-handed.");
	});
});
