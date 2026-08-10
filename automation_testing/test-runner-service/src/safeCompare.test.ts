import { describe, it, expect } from 'vitest';
import { safeCompare } from './safeCompare.js';

describe('safeCompare', () => {
    it('returns true for identical strings', () => {
        expect(safeCompare('hunter2', 'hunter2')).toBe(true);
    });

    it('returns false for different strings of the same length', () => {
        expect(safeCompare('hunter2', 'hunter3')).toBe(false);
    });

    it('returns false for different strings of different lengths', () => {
        expect(safeCompare('short', 'a-much-longer-secret')).toBe(false);
    });

    it('returns false when one side is empty and the other is not', () => {
        expect(safeCompare('', 'hunter2')).toBe(false);
    });
});
