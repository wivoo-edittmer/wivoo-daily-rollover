const ROLLOVER_MARKER = "## Yesterday's Summary";

export function assembleRolloverBlock(
    summary: string | null,
    todos: string[],
    addDivider: boolean
): string {
    const parts: string[] = [];

    parts.push(ROLLOVER_MARKER);
    parts.push(summary ?? '> ⚠️ Claude CLI unavailable — summary skipped');
    parts.push('');

    if (todos.length > 0) {
        parts.push('## Rolled Over');
        parts.push(...todos);
        parts.push('');
    }

    if (addDivider) {
        parts.push('---');
        parts.push('');
    }

    return parts.join('\n');
}

export function prependToNote(existingContent: string, block: string): string {
    if (!existingContent || existingContent.trim() === '') {
        return block;
    }
    return block + existingContent;
}

export function hasRolloverBlock(content: string): boolean {
    return content.includes(ROLLOVER_MARKER);
}
