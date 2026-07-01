import { Plugin } from 'obsidian';
import { WivooRolloverSettings, DEFAULT_SETTINGS, WivooRolloverSettingTab } from './settings';
import { performRollover } from './rollover';

export default class WivooRolloverPlugin extends Plugin {
    settings!: WivooRolloverSettings;

    async onload(): Promise<void> {
        await this.loadSettings();

        this.addRibbonIcon('refresh-cw', 'Roll over daily note', () => {
            performRollover(this.app, this.settings);
        });

        this.addCommand({
            id: 'rollover',
            name: 'Roll over daily note',
            callback: () => { performRollover(this.app, this.settings); },
        });

        this.addSettingTab(new WivooRolloverSettingTab(this.app, this));
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }
}
