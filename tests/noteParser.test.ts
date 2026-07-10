import { parseDailyNote, extractFromRolloverBlock } from '../src/noteParser';

describe('parseDailyNote', () => {
    test('captures unchecked todos at root level', () => {
        const { todos } = parseDailyNote('- [ ] Task A\n- [ ] Task B');
        expect(todos).toEqual(['- [ ] Task A', '- [ ] Task B']);
    });

    test('skips checked todos (x, X, -)', () => {
        const { todos } = parseDailyNote('- [x] Done X\n- [X] Done Cap\n- [-] Done dash\n- [ ] Open');
        expect(todos).toEqual(['- [ ] Open']);
    });

    test('preserves tab-indented sub-todos of open parents', () => {
        const { todos } = parseDailyNote('- [ ] Parent\n\t- [ ] Child');
        expect(todos).toEqual(['- [ ] Parent', '\t- [ ] Child']);
    });

    test('skips sub-todos whose direct parent is checked', () => {
        const { todos } = parseDailyNote('- [x] Done\n\t- [ ] Should skip\n- [ ] Keep');
        expect(todos).toEqual(['- [ ] Keep']);
    });

    test('skips grandchild of checked child but keeps sibling', () => {
        const input = '- [ ] Open parent\n\t- [x] Done child\n\t\t- [ ] Grandchild skip\n\t- [ ] Sibling keep';
        const { todos } = parseDailyNote(input);
        expect(todos).toEqual(['- [ ] Open parent', '\t- [ ] Sibling keep']);
    });

    test('puts non-todo lines in freeForm', () => {
        const { todos, freeForm } = parseDailyNote('## Heading\nProse\n- [ ] Todo\n![[image.png]]');
        expect(todos).toEqual(['- [ ] Todo']);
        expect(freeForm).toEqual(['## Heading', 'Prose', '![[image.png]]']);
    });

    test('handles empty input', () => {
        const { todos, freeForm } = parseDailyNote('');
        expect(todos).toEqual([]);
        expect(freeForm).toEqual([]);
    });
});

describe('extractFromRolloverBlock', () => {
    test('returns null when no Rolled Over section exists', () => {
        expect(extractFromRolloverBlock('- [ ] Task\nSome notes')).toBeNull();
    });

    test('extracts all lines between heading and divider', () => {
        const note = "## Yesterday's Summary\n- bullet\n\n## Rolled Over\n- [ ] Task A\nSome note\n\n---\nMy notes";
        const result = extractFromRolloverBlock(note);
        expect(result).not.toBeNull();
        expect(result!.rolledLines).toEqual(['- [ ] Task A', 'Some note']);
    });

    test('includes non-todo content in rolledLines', () => {
        const note = "## Rolled Over\n- [ ] Task\nContext note\n- Another bullet\n\n---\nBody";
        const result = extractFromRolloverBlock(note);
        expect(result!.rolledLines).toContain('Context note');
        expect(result!.rolledLines).toContain('- Another bullet');
    });

    test('strips existing red spans from rolledLines before they reach assembleRolloverBlock', () => {
        const note = '## Rolled Over\n- [ ] <span style="color: red">Old task</span>\n\n---\nBody';
        const result = extractFromRolloverBlock(note);
        // Raw lines are returned with spans intact; stripRedSpans is applied in noteWriter
        expect(result!.rolledLines[0]).toContain('Old task');
    });

    test('free-form lines come from after the --- divider', () => {
        const note = "## Rolled Over\n- [ ] Task\n\n---\nMeeting notes\nMore notes";
        const result = extractFromRolloverBlock(note);
        const combined = result!.freeFormLines.join('\n');
        expect(combined).toContain('Meeting notes');
        expect(combined).toContain('More notes');
    });

    test('returns empty freeFormLines when no divider present', () => {
        const note = "## Rolled Over\n- [ ] Task";
        const result = extractFromRolloverBlock(note);
        expect(result!.freeFormLines).toEqual([]);
    });

    test('stops section at next ## heading when no divider', () => {
        const note = "## Rolled Over\n- [ ] Task\n\n## My Notes\nBody";
        const result = extractFromRolloverBlock(note);
        expect(result!.rolledLines).toEqual(['- [ ] Task']);
    });

    test('captures everything up to --- even across intermediate ## headings', () => {
        const note = "## Rolled Over\n- [ ] Task\n\n## Long Term\n- [ ] Other item\n\n---\nMy body notes";
        const result = extractFromRolloverBlock(note);
        expect(result!.rolledLines).toContain('- [ ] Task');
        expect(result!.rolledLines).toContain('## Long Term');
        expect(result!.rolledLines).toContain('- [ ] Other item');
        expect(result!.freeFormLines.join('\n')).toContain('My body notes');
    });
});
