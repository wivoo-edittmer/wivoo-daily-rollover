import { assembleRolloverBlock, prependToNote, hasRolloverBlock } from '../src/noteWriter';

describe('assembleRolloverBlock', () => {
    test('includes summary section with bullets', () => {
        const block = assembleRolloverBlock('- bullet 1\n- bullet 2', [], false);
        expect(block).toContain("## Yesterday's Summary");
        expect(block).toContain('- bullet 1\n- bullet 2');
    });

    test('shows warning when summary is null', () => {
        const block = assembleRolloverBlock(null, [], false);
        expect(block).toContain('⚠️ Claude CLI unavailable');
    });

    test('includes rolled-over section with todos', () => {
        const block = assembleRolloverBlock(null, ['- [ ] Task A', '\t- [ ] Sub'], false);
        expect(block).toContain('## Rolled Over');
        expect(block).toContain('- [ ] Task A');
        expect(block).toContain('\t- [ ] Sub');
    });

    test('omits rolled-over section when there are no todos', () => {
        const block = assembleRolloverBlock('- summary', [], false);
        expect(block).not.toContain('## Rolled Over');
    });

    test('appends divider when addDivider is true', () => {
        const block = assembleRolloverBlock(null, [], true);
        expect(block).toContain('\n---\n');
    });

    test('omits divider when addDivider is false', () => {
        const block = assembleRolloverBlock(null, [], false);
        expect(block).not.toContain('---');
    });
});

describe('prependToNote', () => {
    test('prepends block before existing content', () => {
        expect(prependToNote('existing', 'BLOCK\n')).toBe('BLOCK\nexisting');
    });

    test('returns block alone when existing content is empty', () => {
        expect(prependToNote('', 'BLOCK\n')).toBe('BLOCK\n');
    });

    test('returns block alone when existing content is only whitespace', () => {
        expect(prependToNote('   \n', 'BLOCK\n')).toBe('BLOCK\n');
    });
});

describe('hasRolloverBlock', () => {
    test('returns true when marker is present', () => {
        expect(hasRolloverBlock("## Yesterday's Summary\n- bullet")).toBe(true);
    });

    test('returns false when marker is absent', () => {
        expect(hasRolloverBlock('- [ ] Some todo\nSome notes')).toBe(false);
    });
});
