import { describe, it, expect } from 'vitest';
import { generateCsrfToken, readCookie } from './csrf.js';

describe('generateCsrfToken', () => {
    it('generates a non-empty, unique token each call', () => {
        const a = generateCsrfToken();
        const b = generateCsrfToken();
        expect(a).toBeTruthy();
        expect(a).not.toBe(b);
    });
});

describe('readCookie', () => {
    it('reads a single cookie', () => {
        expect(readCookie('csrfToken=abc123', 'csrfToken')).toBe('abc123');
    });

    it('reads the right cookie among several, regardless of spacing', () => {
        expect(readCookie('a=1;csrfToken=abc123; b=2', 'csrfToken')).toBe('abc123');
    });

    it('returns undefined when the header is missing entirely', () => {
        expect(readCookie(undefined, 'csrfToken')).toBeUndefined();
    });

    it('returns undefined when the named cookie is not present', () => {
        expect(readCookie('a=1; b=2', 'csrfToken')).toBeUndefined();
    });

    it('decodes a URL-encoded value', () => {
        expect(readCookie('csrfToken=abc%2F123', 'csrfToken')).toBe('abc/123');
    });
});
