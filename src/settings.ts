import { App, PluginSettingTab, Setting } from "obsidian";

import type YamlTemplatePlugin from "./main";

/**
 * Persisted plugin settings.
 */
export interface YamlTemplateSettings {
	/** Vault-relative folder that template files are resolved from. */
	templatesFolder: string;
	/** Optional template name used when a block omits the `template` key. */
	defaultTemplate: string;
	/** Whether rendered HTML is sanitized before injection. */
	sanitize: boolean;
}

export const DEFAULT_SETTINGS: YamlTemplateSettings = {
	templatesFolder: "HTML Templates",
	defaultTemplate: "",
	sanitize: true,
};

/**
 * Settings tab exposing the templates folder, default template, and sanitize toggle.
 */
export class YamlTemplateSettingTab extends PluginSettingTab {
	private readonly plugin: YamlTemplatePlugin;

	constructor(app: App, plugin: YamlTemplatePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Templates folder")
			.setDesc(
				"Vault-relative folder that template files are resolved from. " +
					"A block's `template: name` is looked up as name.md, name.html.md, or name.html in this folder.",
			)
			.addText((text) =>
				text
					.setPlaceholder("HTML Templates")
					.setValue(this.plugin.settings.templatesFolder)
					.onChange(async (value) => {
						this.plugin.settings.templatesFolder = normalizeFolder(value);
						await this.plugin.saveSettings();
						this.plugin.refreshAllRenderedBlocks();
					}),
			);

		new Setting(containerEl)
			.setName("Default template")
			.setDesc(
				"Template name used when a yamltemplate block does not specify a `template` key. Leave blank to require an explicit template.",
			)
			.addText((text) =>
				text
					.setPlaceholder("(none)")
					.setValue(this.plugin.settings.defaultTemplate)
					.onChange(async (value) => {
						this.plugin.settings.defaultTemplate = value.trim();
						await this.plugin.saveSettings();
						this.plugin.refreshAllRenderedBlocks();
					}),
			);

		new Setting(containerEl)
			.setName("Sanitize rendered HTML")
			.setDesc(
				"Strip scripts and dangerous attributes from the rendered output before injecting it into the note. " +
					"Recommended. Disable only if you fully trust every template.",
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.sanitize).onChange(async (value) => {
					this.plugin.settings.sanitize = value;
					await this.plugin.saveSettings();
					this.plugin.refreshAllRenderedBlocks();
				}),
			);
	}
}

/**
 * Trim whitespace and strip leading/trailing slashes from a folder path.
 *
 * @param value - Raw folder path from user input.
 * @returns The normalized vault-relative folder path.
 */
function normalizeFolder(value: string): string {
	return value.trim().replace(/^\/+|\/+$/g, "");
}
