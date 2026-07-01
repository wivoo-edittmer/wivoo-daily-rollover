import { parseDailyNote } from '../src/noteParser';

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
