import { Plugin } from 'obsidian';

export default class WivooRolloverPlugin extends Plugin {
    async onload(): Promise<void> {
        console.log('Wivoo Daily Rollover loaded');
    }
}
