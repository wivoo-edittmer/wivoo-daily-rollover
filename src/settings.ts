import { App, PluginSettingTab, Setting } from 'obsidian';
import WivooRolloverPlugin from './main';

export interface WivooRolloverSettings {
    claudeBinaryPath: string;
    summaryPrompt: string;
    addDivider: boolean;
}

export const DEFAULT_SETTINGS: WivooRolloverSettings = {
    claudeBinaryPath: 'claude',
    summaryPrompt: `Summarize these notes in 3-5 concise bullet points.
Focus on decisions made, key context, and blockers.
Output only the bullet points, no preamble or explanation.`,
    addDivider: true,
};

export class WivooRolloverSettingTab extends PluginSettingTab {
    plugin: WivooRolloverPlugin;

    constructor(app: App, plugin: WivooRolloverPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Claude binary path')
            .setDesc('Path to the claude CLI binary. Default: "claude" (on PATH).')
            .addText(text => text
                .setValue(this.plugin.settings.claudeBinaryPath)
                .onChange(async (value: string) => {
                    this.plugin.settings.claudeBinaryPath = value.trim() || 'claude';
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Summary prompt')
            .setDesc('Prompt sent to Claude with the free-form note content.')
            .addTextArea(text => {
                text.setValue(this.plugin.settings.summaryPrompt)
                    .onChange(async (value: string) => {
                        this.plugin.settings.summaryPrompt = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.rows = 6;
                text.inputEl.cols = 50;
            });

        new Setting(containerEl)
            .setName('Add divider after rollover block')
            .setDesc('Insert a horizontal rule (---) after the rolled-over content.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.addDivider)
                .onChange(async (value: boolean) => {
                    this.plugin.settings.addDivider = value;
                    await this.plugin.saveSettings();
                }));
    }
}
