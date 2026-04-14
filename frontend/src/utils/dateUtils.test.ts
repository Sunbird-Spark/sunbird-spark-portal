import { describe, it, expect } from 'vitest';
import { toRelativeTime } from './dateUtils';

describe('toRelativeTime', () => {
  it('returns relative time for a valid ISO date', () => {
    const now = new Date('2024-01-10T00:00:00Z');
    const result = toRelativeTime('2024-01-09T00:00:00Z', now);
    expect(result).toContain('day');
  });

  it('returns "—" for an invalid date string', () => {
    expect(toRelativeTime('not-a-date')).toBe('—');
  });

  it('returns "—" for empty string', () => {
    expect(toRelativeTime('')).toBe('—');
  });

  it('uses current time when now is not provided', () => {
    const result = toRelativeTime(new Date().toISOString());
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
