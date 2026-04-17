import { describe, it, expect } from 'vitest';
import { getPlaceholderImage } from './getPlaceholderImage';

describe('getPlaceholderImage', () => {
  it('returns a string for a given seed', () => {
    expect(typeof getPlaceholderImage('some-id')).toBe('string');
  });

  it('returns a string when seed is null (line 14 early return)', () => {
    expect(typeof getPlaceholderImage(null)).toBe('string');
  });

  it('returns a string when seed is undefined (line 14 early return)', () => {
    expect(typeof getPlaceholderImage(undefined)).toBe('string');
  });

  it('returns a string when seed is empty string (falsy early return)', () => {
    expect(typeof getPlaceholderImage('')).toBe('string');
  });

  it('returns the same value for the same seed (deterministic)', () => {
    expect(getPlaceholderImage('abc')).toBe(getPlaceholderImage('abc'));
  });

  it('returns different images for different seeds', () => {
    const seeds = ['a', 'bc', 'def', 'ghij', 'klmno', 'pqrstu', 'vwxyz12'];
    const results = new Set(seeds.map(getPlaceholderImage));
    expect(results.size).toBeGreaterThan(1);
  });

  it('handles long seed strings without throwing', () => {
    const longSeed = 'x'.repeat(1000);
    expect(() => getPlaceholderImage(longSeed)).not.toThrow();
  });
});
