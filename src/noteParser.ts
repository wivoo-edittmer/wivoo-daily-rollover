export interface ParsedNote {
    todos: string[];
    freeForm: string[];
}

export interface ExtractedSections {
    rolledLines: string[];
    freeFormLines: string[];
}

const ROLLED_OVER_HEADING = '## Rolled Over';

/**
 * Extracts content from a note that already contains a rollover block.
 * Returns null if the note has no "## Rolled Over" section.
 *
 * rolledLines  — every non-blank line between "## Rolled Over" and the next --- or ## heading
 * freeFormLines — every line after the first --- divider (the original note body)
 */
export function extractFromRolloverBlock(content: string): ExtractedSections | null {
    const idx = content.indexOf(ROLLED_OVER_HEADING);
    if (idx === -1) return null;

    const afterHeading = content.slice(idx + ROLLED_OVER_HEADING.length);

    // Find where the Rolled Over section ends (--- divider or next ## heading)
    const dividerInSection = afterHeading.search(/\n---(?:\n|$)/);
    const nextHeadingInSection = afterHeading.search(/\n## /);

    let sectionEnd: number;
    if (dividerInSection !== -1 && (nextHeadingInSection === -1 || dividerInSection < nextHeadingInSection)) {
        sectionEnd = dividerInSection;
    } else if (nextHeadingInSection !== -1) {
        sectionEnd = nextHeadingInSection;
    } else {
        sectionEnd = afterHeading.length;
    }

    const rolledLines = afterHeading
        .slice(0, sectionEnd)
        .split('\n')
        .filter(l => l.trim().length > 0);

    // Free-form = everything after the first --- divider in the full content
    const dividerMatch = content.match(/\n---\n([\s\S]*)/);
    const freeFormLines = dividerMatch
        ? dividerMatch[1].split('\n')
        : [];

    return { rolledLines, freeFormLines };
}

const CHECKED_MARKERS = new Set(['x', 'X', '-']);
const TODO_RE = /^(\t*)- \[(.)\] /;

export function parseDailyNote(content: string): ParsedNote {
    if (!content) return { todos: [], freeForm: [] };

    const lines = content.split('\n');
    const todos: string[] = [];
    const freeForm: string[] = [];

    // When set, any todo line with indent > blockedIndent is a child of a checked parent
    let blockedIndent: number | null = null;

    for (const line of lines) {
        const match = line.match(TODO_RE);

        if (!match) {
            freeForm.push(line);
            continue;
        }

        const indent = match[1].length;
        const marker = match[2];
        const isChecked = CHECKED_MARKERS.has(marker);

        // Coming back up to or above the blocked level clears the block
        if (blockedIndent !== null && indent <= blockedIndent) {
            blockedIndent = null;
        }

        if (isChecked) {
            blockedIndent = indent;
        } else if (blockedIndent !== null && indent > blockedIndent) {
            // Child of a checked ancestor — skip
        } else {
            todos.push(line);
        }
    }

    return { todos, freeForm };
}
