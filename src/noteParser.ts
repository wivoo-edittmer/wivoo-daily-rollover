export interface ParsedNote {
    todos: string[];
    freeForm: string[];
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
