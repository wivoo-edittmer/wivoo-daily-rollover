import { App, Modal, Notice, TFile } from 'obsidian';
import { WivooRolloverSettings } from './settings';
import { parseDailyNote } from './noteParser';
import { summarize } from './claudeSummarize';
import { assembleRolloverBlock, prependToNote, hasRolloverBlock, removeRolloverBlock } from './noteWriter';

const DAILY_NOTE_FOLDER = '0 - Daily Note';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_MAP: Record<string, number> = Object.fromEntries(MONTH_NAMES.map((m, i) => [m, i]));
const DATE_RE = /^(\d{4})-([A-Za-z]{3})-(\d{2})$/;

export function parseDailyNoteDate(filename: string): Date | null {
    const match = filename.match(DATE_RE);
    if (!match) return null;
    const month = MONTH_MAP[match[2]];
    if (month === undefined) return null;
    return new Date(parseInt(match[1]), month, parseInt(match[3]));
}

export function getTodayPath(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = MONTH_NAMES[now.getMonth()];
    const d = String(now.getDate()).padStart(2, '0');
    return `${DAILY_NOTE_FOLDER}/${y}-${m}-${d}.md`;
}

type SummaryStatus = 'generated' | 'skipped' | 'failed';

class RolloverResultModal extends Modal {
    constructor(
        app: App,
        private sourceNote: string,
        private todoCount: number,
        private summaryStatus: SummaryStatus
    ) {
        super(app);
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Rollover complete' });

        const grid = contentEl.createDiv({ cls: 'wivoo-result-grid' });
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'auto 1fr';
        grid.style.gap = '6px 16px';
        grid.style.margin = '12px 0 20px';

        const row = (label: string, value: string) => {
            grid.createEl('span', { text: label, cls: 'wivoo-result-label' }).style.fontWeight = 'bold';
            grid.createEl('span', { text: value });
        };

        row('Source', this.sourceNote);
        row(
            'Action items',
            this.todoCount > 0
                ? `${this.todoCount} rolled over (shown in red)`
                : 'None found'
        );
        row('AI summary', {
            generated: 'Generated ✓',
            skipped: 'Skipped — no free-form content',
            failed: 'Unavailable — Claude CLI error',
        }[this.summaryStatus]);

        const btn = contentEl.createEl('button', { text: 'Close' });
        btn.style.marginTop = '4px';
        btn.onclick = () => this.close();
    }

    onClose(): void {
        this.contentEl.empty();
    }
}

class ConfirmModal extends Modal {
    private message: string;
    private resolve?: (value: boolean) => void;

    constructor(app: App, message: string) {
        super(app);
        this.message = message;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.createEl('p', { text: this.message });
        const row = contentEl.createDiv({ cls: 'modal-button-container' });

        const yes = row.createEl('button', { text: 'Yes, overwrite' });
        yes.onclick = () => { this.resolve?.(true); this.close(); };

        const no = row.createEl('button', { text: 'Cancel' });
        no.onclick = () => { this.resolve?.(false); this.close(); };
    }

    onClose(): void {
        this.contentEl.empty();
        this.resolve?.(false);  // Escape / X = implicit cancel
    }

    prompt(): Promise<boolean> {
        this.open();
        return new Promise(res => { this.resolve = res; });
    }
}

export async function performRollover(app: App, settings: WivooRolloverSettings): Promise<void> {
    try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find most recent daily note before today
    let sourceFile: TFile | null = null;
    let mostRecentDate: Date | null = null;

    for (const file of app.vault.getMarkdownFiles()) {
        if (file.parent?.path !== DAILY_NOTE_FOLDER) continue;
        const date = parseDailyNoteDate(file.basename);
        if (!date) continue;
        date.setHours(0, 0, 0, 0);
        if (date >= today) continue;
        if (!mostRecentDate || date > mostRecentDate) {
            mostRecentDate = date;
            sourceFile = file;
        }
    }

    if (!sourceFile) {
        new Notice('No previous daily note found to roll over.');
        return;
    }

    // Get or prepare today's note
    const todayPath = getTodayPath();
    const todayAbstract = app.vault.getAbstractFileByPath(todayPath);
    const todayFile = todayAbstract instanceof TFile ? todayAbstract : null;
    const todayContent = todayFile ? await app.vault.read(todayFile) : '';

    // Duplicate guard
    let baseContent = todayContent;
    if (hasRolloverBlock(todayContent)) {
        const confirmed = await new ConfirmModal(
            app,
            'Rollover already applied today — run again and overwrite?'
        ).prompt();
        if (!confirmed) return;
        baseContent = removeRolloverBlock(todayContent);
    }

    // Parse source note
    const sourceContent = await app.vault.read(sourceFile);
    const { todos, freeForm } = parseDailyNote(sourceContent);

    // Summarize free-form content (skip Claude call if there is nothing to summarize)
    const nonEmptyFreeForm = freeForm.filter(l => l.trim().length > 0);
    let summaryStatus: SummaryStatus = 'skipped';
    let summary: string | null = null;

    if (nonEmptyFreeForm.length > 0) {
        new Notice('Rolling over… calling Claude CLI');
        summary = await summarize(nonEmptyFreeForm.join('\n'), settings.claudeBinaryPath, settings.summaryPrompt);
        summaryStatus = summary ? 'generated' : 'failed';
    }

    // Assemble and write
    const block = assembleRolloverBlock(summary, todos, settings.addDivider);
    const newContent = prependToNote(baseContent, block);

    if (todayFile) {
        await app.vault.modify(todayFile, newContent);
    } else {
        await app.vault.create(todayPath, newContent);
    }

    new RolloverResultModal(app, sourceFile.basename, todos.length, summaryStatus).open();
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        new Notice(`Rollover failed: ${message}`);
    }
}
