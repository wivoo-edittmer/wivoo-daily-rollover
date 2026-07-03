const ROLLOVER_MARKER = "## Yesterday's Summary";

const UNCHECKED_TODO_RE = /^(\t*)(- \[ \] )(.*)$/;

function colorTodoRed(line: string): string {
    const match = line.match(UNCHECKED_TODO_RE);
    if (!match) return line;
    const [, indent, checkbox, text] = match;
    return `${indent}${checkbox}<span style="color: red">${text}</span>`;
}

export function removeRolloverBlock(content: string): string {
    if (!content.includes(ROLLOVER_MARKER)) return content;
    const markerIdx = content.indexOf(ROLLOVER_MARKER);
    if (markerIdx === -1) return content;
    const afterMarker = content.slice(markerIdx);
    // Match the block up to and including the optional '---\n' divider
    const blockEnd = afterMarker.match(/^([\s\S]*?\n---\n)/);
    if (blockEnd) {
        return content.slice(0, markerIdx) + content.slice(markerIdx + blockEnd[1].length);
    }
    // No divider — remove from marker to next top-level heading or EOF
    const nextHeading = afterMarker.slice(ROLLOVER_MARKER.length).search(/\n## /);
    if (nextHeading !== -1) {
        const cutEnd = markerIdx + ROLLOVER_MARKER.length + nextHeading + 1; // +1 for the \n
        return content.slice(0, markerIdx) + content.slice(cutEnd);
    }
    // No subsequent heading — remove entire rest of content
    return content.slice(0, markerIdx);
}

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
        parts.push(...todos.map(colorTodoRed));
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
