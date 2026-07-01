var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => WivooRolloverPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  claudeBinaryPath: "claude",
  summaryPrompt: `Summarize these notes in 3-5 concise bullet points.
Focus on decisions made, key context, and blockers.
Output only the bullet points, no preamble or explanation.`,
  addDivider: true
};
var WivooRolloverSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Claude binary path").setDesc('Path to the claude CLI binary. Default: "claude" (on PATH).').addText((text) => text.setValue(this.plugin.settings.claudeBinaryPath).onChange(async (value) => {
      this.plugin.settings.claudeBinaryPath = value.trim() || "claude";
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Summary prompt").setDesc("Prompt sent to Claude with the free-form note content.").addTextArea((text) => {
      text.setValue(this.plugin.settings.summaryPrompt).onChange(async (value) => {
        this.plugin.settings.summaryPrompt = value;
        await this.plugin.saveSettings();
      });
      text.inputEl.rows = 6;
      text.inputEl.cols = 50;
    });
    new import_obsidian.Setting(containerEl).setName("Add divider after rollover block").setDesc("Insert a horizontal rule (---) after the rolled-over content.").addToggle((toggle) => toggle.setValue(this.plugin.settings.addDivider).onChange(async (value) => {
      this.plugin.settings.addDivider = value;
      await this.plugin.saveSettings();
    }));
  }
};

// src/rollover.ts
var import_obsidian2 = require("obsidian");

// src/noteParser.ts
var CHECKED_MARKERS = /* @__PURE__ */ new Set(["x", "X", "-"]);
var TODO_RE = /^(\t*)- \[(.)\] /;
function parseDailyNote(content) {
  if (!content) return { todos: [], freeForm: [] };
  const lines = content.split("\n");
  const todos = [];
  const freeForm = [];
  let blockedIndent = null;
  for (const line of lines) {
    const match = line.match(TODO_RE);
    if (!match) {
      freeForm.push(line);
      continue;
    }
    const indent = match[1].length;
    const marker = match[2];
    const isChecked = CHECKED_MARKERS.has(marker);
    if (blockedIndent !== null && indent <= blockedIndent) {
      blockedIndent = null;
    }
    if (isChecked) {
      blockedIndent = indent;
    } else if (blockedIndent !== null && indent > blockedIndent) {
    } else {
      todos.push(line);
    }
  }
  return { todos, freeForm };
}

// src/claudeSummarize.ts
var import_child_process = require("child_process");
function summarize(freeFormContent, claudePath, prompt) {
  const fullPrompt = `${prompt}

${freeFormContent}`;
  return new Promise((resolve) => {
    (0, import_child_process.execFile)(
      claudePath,
      ["-p", fullPrompt],
      { timeout: 3e4 },
      (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve(null);
        } else {
          resolve(stdout.trim());
        }
      }
    );
  });
}

// src/noteWriter.ts
var ROLLOVER_MARKER = "## Yesterday's Summary";
function assembleRolloverBlock(summary, todos, addDivider) {
  const parts = [];
  parts.push(ROLLOVER_MARKER);
  parts.push(summary != null ? summary : "> \u26A0\uFE0F Claude CLI unavailable \u2014 summary skipped");
  parts.push("");
  if (todos.length > 0) {
    parts.push("## Rolled Over");
    parts.push(...todos);
    parts.push("");
  }
  if (addDivider) {
    parts.push("---");
    parts.push("");
  }
  return parts.join("\n");
}
function prependToNote(existingContent, block) {
  if (!existingContent || existingContent.trim() === "") {
    return block;
  }
  return block + existingContent;
}
function hasRolloverBlock(content) {
  return content.includes(ROLLOVER_MARKER);
}

// src/rollover.ts
var DAILY_NOTE_FOLDER = "0 - Daily Note";
var MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var MONTH_MAP = Object.fromEntries(MONTH_NAMES.map((m, i) => [m, i]));
var DATE_RE = /^(\d{4})-([A-Za-z]{3})-(\d{2})$/;
function parseDailyNoteDate(filename) {
  const match = filename.match(DATE_RE);
  if (!match) return null;
  const month = MONTH_MAP[match[2]];
  if (month === void 0) return null;
  return new Date(parseInt(match[1]), month, parseInt(match[3]));
}
function getTodayPath() {
  const now = /* @__PURE__ */ new Date();
  const y = now.getFullYear();
  const m = MONTH_NAMES[now.getMonth()];
  const d = String(now.getDate()).padStart(2, "0");
  return `${DAILY_NOTE_FOLDER}/${y}-${m}-${d}.md`;
}
var ConfirmModal = class extends import_obsidian2.Modal {
  constructor(app, message) {
    super(app);
    this.message = message;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("p", { text: this.message });
    const row = contentEl.createDiv({ cls: "modal-button-container" });
    const yes = row.createEl("button", { text: "Yes, overwrite" });
    yes.onclick = () => {
      this.resolve(true);
      this.close();
    };
    const no = row.createEl("button", { text: "Cancel" });
    no.onclick = () => {
      this.resolve(false);
      this.close();
    };
  }
  onClose() {
    this.contentEl.empty();
  }
  prompt() {
    this.open();
    return new Promise((res) => {
      this.resolve = res;
    });
  }
};
async function performRollover(app, settings) {
  var _a;
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  let sourceFile = null;
  let mostRecentDate = null;
  for (const file of app.vault.getMarkdownFiles()) {
    if (((_a = file.parent) == null ? void 0 : _a.path) !== DAILY_NOTE_FOLDER) continue;
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
    new import_obsidian2.Notice("No previous daily note found to roll over.");
    return;
  }
  const todayPath = getTodayPath();
  const todayAbstract = app.vault.getAbstractFileByPath(todayPath);
  const todayFile = todayAbstract instanceof import_obsidian2.TFile ? todayAbstract : null;
  const todayContent = todayFile ? await app.vault.read(todayFile) : "";
  if (hasRolloverBlock(todayContent)) {
    const confirmed = await new ConfirmModal(
      app,
      "Rollover already applied today \u2014 run again and overwrite?"
    ).prompt();
    if (!confirmed) return;
  }
  const sourceContent = await app.vault.read(sourceFile);
  const { todos, freeForm } = parseDailyNote(sourceContent);
  new import_obsidian2.Notice("Rolling over\u2026 calling Claude CLI");
  const nonEmptyFreeForm = freeForm.filter((l) => l.trim().length > 0);
  const summary = nonEmptyFreeForm.length > 0 ? await summarize(nonEmptyFreeForm.join("\n"), settings.claudeBinaryPath, settings.summaryPrompt) : null;
  const block = assembleRolloverBlock(summary, todos, settings.addDivider);
  const newContent = prependToNote(todayContent, block);
  if (todayFile) {
    await app.vault.modify(todayFile, newContent);
  } else {
    await app.vault.create(todayPath, newContent);
  }
  new import_obsidian2.Notice(`Rolled over from ${sourceFile.basename} \u2713`);
}

// src/main.ts
var WivooRolloverPlugin = class extends import_obsidian3.Plugin {
  async onload() {
    await this.loadSettings();
    this.addRibbonIcon("refresh-cw", "Roll over daily note", () => {
      performRollover(this.app, this.settings);
    });
    this.addCommand({
      id: "rollover",
      name: "Roll over daily note",
      callback: () => {
        performRollover(this.app, this.settings);
      }
    });
    this.addSettingTab(new WivooRolloverSettingTab(this.app, this));
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
