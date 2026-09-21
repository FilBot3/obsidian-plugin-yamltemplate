import {
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
	Plugin,
	TAbstractFile,
	TFile,
} from "obsidian";

import { parseBlock, renderTemplate, sanitizeHtml } from "./renderer";
import { DEFAULT_SETTINGS, YamlTemplateSettingTab, YamlTemplateSettings } from "./settings";
import { findTemplateFile, resolveTemplate } from "./template-resolver";

/** The fenced code-block language this plugin processes. */
const BLOCK_LANGUAGE = "yamltemplate";

/**
 * A single rendered yamltemplate block, tracked so it can be re-rendered when
 * settings change or a template file it depends on is modified.
 */
interface RenderedBlock {
	/** The element the rendered HTML is injected into. */
	readonly el: HTMLElement;
	/** The raw source inside the yamltemplate fenced block. */
	readonly source: string;
	/** Path of the note that contains the block, for helpful error messages. */
	readonly sourcePath: string;
	/** Resolved path of the template file this block depends on, if known. */
	templatePath: string | null;
}

/**
 * Obsidian plugin that renders yamltemplate code blocks by applying their YAML
 * data to a Handlebars HTML template resolved from a configurable folder.
 */
export default class YamlTemplatePlugin extends Plugin {
	settings: YamlTemplateSettings = { ...DEFAULT_SETTINGS };

	/** All currently mounted rendered blocks. */
	private readonly rendered = new Set<RenderedBlock>();

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new YamlTemplateSettingTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor(
			BLOCK_LANGUAGE,
			(source, el, ctx) => this.processBlock(source, el, ctx),
		);

		// Live refresh: when a template file changes, re-render dependent blocks.
		this.registerEvent(this.app.vault.on("modify", (file) => this.onTemplateFileChanged(file)));
		this.registerEvent(this.app.vault.on("rename", (file) => this.onTemplateFileChanged(file)));
		this.registerEvent(this.app.vault.on("delete", (file) => this.onTemplateFileChanged(file)));
	}

	onunload(): void {
		this.rendered.clear();
	}

	/**
	 * Loads persisted settings, merging over defaults.
	 */
	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * Persists the current settings to disk.
	 */
	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	/**
	 * Re-renders every currently mounted yamltemplate block.
	 *
	 * Called after settings changes so that folder/default/sanitize edits take
	 * effect without reopening notes.
	 */
	refreshAllRenderedBlocks(): void {
		for (const block of this.rendered) {
			void this.renderInto(block);
		}
	}

	/**
	 * Processes one yamltemplate code block: registers it for lifecycle tracking
	 * and renders it into the provided element.
	 *
	 * @param source - The raw text inside the fenced block.
	 * @param el - The element to render the output into.
	 * @param ctx - The markdown post-processor context for this block.
	 */
	private processBlock(
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext,
	): void {
		const block: RenderedBlock = {
			el,
			source,
			sourcePath: ctx.sourcePath,
			templatePath: null,
		};

		this.rendered.add(block);

		// Remove the block from tracking when its render child is unloaded.
		const child = new MarkdownRenderChild(el);
		child.register(() => this.rendered.delete(block));
		ctx.addChild(child);

		void this.renderInto(block);
	}

	/**
	 * Renders a tracked block, replacing the element's contents with the result
	 * or an inline error message.
	 *
	 * @param block - The tracked block to render.
	 */
	private async renderInto(block: RenderedBlock): Promise<void> {
		try {
			const { templateName, data } = parseBlock(block.source);
			const name = templateName ?? this.settings.defaultTemplate;

			if (!name) {
				throw new Error(
					"No template specified. Add a `template: name` key to the block, " +
						"or set a default template in the plugin settings.",
				);
			}

			const resolved = await resolveTemplate(this.app, this.settings.templatesFolder, name);
			if (!resolved) {
				throw new Error(
					`Template "${name}" not found in "${this.settings.templatesFolder}". ` +
						"Expected a file named " +
						`${name}.md, ${name}.html.md, or ${name}.html there.`,
				);
			}

			block.templatePath = resolved.file.path;

			const rawHtml = renderTemplate(resolved.source, data);
			const html = this.settings.sanitize ? sanitizeHtml(rawHtml) : rawHtml;

			this.renderHtml(block.el, html);
		} catch (error) {
			block.templatePath = block.templatePath ?? null;
			this.renderError(block.el, error);
		}
	}

	/**
	 * Replaces an element's contents with rendered template HTML.
	 *
	 * @param el - The element to populate.
	 * @param html - The (already sanitized, if enabled) HTML to inject.
	 */
	private renderHtml(el: HTMLElement, html: string): void {
		el.empty();
		const container = el.createDiv({ cls: "yamltemplate-rendered" });
		// Rendered output is sanitized upstream (renderInto) when the setting is on.
		container.innerHTML = html;
	}

	/**
	 * Replaces an element's contents with an inline error box.
	 *
	 * @param el - The element to populate.
	 * @param error - The error to display.
	 */
	private renderError(el: HTMLElement, error: unknown): void {
		el.empty();
		const box = el.createDiv({ cls: "yamltemplate-error" });
		box.createDiv({ cls: "yamltemplate-error__title", text: "YAML Template error" });
		const message = error instanceof Error ? error.message : String(error);
		box.createDiv({ cls: "yamltemplate-error__detail", text: message });
	}

	/**
	 * Re-renders blocks that depend on a changed template file.
	 *
	 * Matches both by resolved template path and by whether the changed file
	 * lives in the configured templates folder (so newly-created templates and
	 * renames are picked up for blocks that previously failed to resolve).
	 *
	 * @param file - The vault file that was modified, renamed, or deleted.
	 */
	private onTemplateFileChanged(file: TAbstractFile): void {
		if (!(file instanceof TFile)) {
			return;
		}

		const folder = this.settings.templatesFolder.replace(/^\/+|\/+$/g, "");
		const inTemplatesFolder =
			folder.length === 0 ? true : file.path.startsWith(`${folder}/`);

		for (const block of this.rendered) {
			const dependsOnFile = block.templatePath === file.path;
			// Blocks that failed to resolve (no templatePath) may now succeed.
			const mayNowResolve = block.templatePath === null && inTemplatesFolder;

			if (dependsOnFile || mayNowResolve || this.blockTargetsFile(block, file)) {
				void this.renderInto(block);
			}
		}
	}

	/**
	 * Reports whether a block's `template` name resolves to the given file.
	 *
	 * @param block - The tracked block to test.
	 * @param file - The candidate template file.
	 * @returns True if the block's template name resolves to the file's path.
	 */
	private blockTargetsFile(block: RenderedBlock, file: TFile): boolean {
		let name: string | null;
		try {
			name = parseBlock(block.source).templateName;
		} catch {
			name = null;
		}

		const effective = name ?? this.settings.defaultTemplate;
		if (!effective) {
			return false;
		}

		const target = findTemplateFile(this.app, this.settings.templatesFolder, effective);
		return target?.path === file.path;
	}
}
