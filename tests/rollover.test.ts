import { parseDailyNoteDate, getTodayPath } from '../src/rollover';

describe('parseDailyNoteDate', () => {
    test('parses a valid YYYY-MMM-DD filename', () => {
        const date = parseDailyNoteDate('2026-Jun-30');
        expect(date).not.toBeNull();
        expect(date!.getFullYear()).toBe(2026);
        expect(date!.getMonth()).toBe(5);
        expect(date!.getDate()).toBe(30);
    });

    test('returns null for non-matching filenames', () => {
        expect(parseDailyNoteDate('meeting-notes')).toBeNull();
        expect(parseDailyNoteDate('2026-Xyz-01')).toBeNull();
        expect(parseDailyNoteDate('')).toBeNull();
    });

    test('parses all twelve months correctly', () => {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        months.forEach((m, i) => {
            const date = parseDailyNoteDate(`2026-${m}-01`);
            expect(date).not.toBeNull();
            expect(date!.getMonth()).toBe(i);
        });
    });
});

describe('getTodayPath', () => {
    test('returns a path matching the expected format', () => {
        const path = getTodayPath();
        expect(path).toMatch(/^0 - Daily Note\/\d{4}-[A-Z][a-z]{2}-\d{2}\.md$/);
    });
});
