export class Plugin {}
export class TFile {
    basename = '';
    path = '';
    parent: { path: string } | null = null;
}
export class Modal {
    app: any;
    contentEl: any = {
        createEl: (_tag: string, _opts?: any) => ({ onclick: null }),
        createDiv: (_opts?: any) => ({
            createEl: (_tag: string, _opts?: any) => ({ onclick: null }),
        }),
        empty: () => {},
    };
    constructor(app: any) { this.app = app; }
    open() {}
    close() {}
}
export class PluginSettingTab {
    app: any;
    plugin: any;
    containerEl: any = { empty: () => {}, createEl: () => ({}) };
    constructor(app: any, plugin: any) { this.app = app; this.plugin = plugin; }
    display() {}
}
export class Setting {
    constructor(_containerEl: any) {}
    setName(_name: string) { return this; }
    setDesc(_desc: string) { return this; }
    addText(cb: (t: any) => any) { cb({ setValue: () => ({ onChange: () => ({}) }) }); return this; }
    addTextArea(cb: (t: any) => any) { cb({ setValue: () => ({ onChange: () => ({}) }), inputEl: { rows: 0, cols: 0 } }); return this; }
    addToggle(cb: (t: any) => any) { cb({ setValue: () => ({ onChange: () => ({}) }) }); return this; }
}
export class Notice {
    constructor(_message: string) {}
}
