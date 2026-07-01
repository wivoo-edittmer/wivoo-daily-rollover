import { assembleRolloverBlock, prependToNote, hasRolloverBlock, removeRolloverBlock } from '../src/noteWriter';

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

describe('removeRolloverBlock', () => {
    test('removes rollover block with divider', () => {
        const content = "## Yesterday's Summary\n- bullet\n\n## Rolled Over\n- [ ] Todo\n\n---\nMy notes";
        const result = removeRolloverBlock(content);
        expect(result).toBe('My notes');
        expect(result).not.toContain("## Yesterday's Summary");
    });

    test('returns content unchanged when no rollover block present', () => {
        const content = '- [ ] Some todo\nSome notes';
        expect(removeRolloverBlock(content)).toBe(content);
    });

    test('removes rollover block without divider, preserves subsequent heading', () => {
        const content = "## Yesterday's Summary\n- bullet\n\n## My Meeting Notes\nDetails";
        const result = removeRolloverBlock(content);
        expect(result).not.toContain("## Yesterday's Summary");
        expect(result).toContain('## My Meeting Notes');
    });
});
