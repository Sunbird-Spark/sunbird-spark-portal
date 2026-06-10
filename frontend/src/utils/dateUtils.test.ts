import { describe, it, expect } from 'vitest';
import { toRelativeTime, formatDayMonthYear } from './dateUtils';

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

describe('formatDayMonthYear', () => {
  it('formats an ISO date as dd/MM/yyyy', () => {
    expect(formatDayMonthYear('2026-03-15T10:30:00.000Z')).toBe('15/03/2026');
  });

  it('zero-pads single-digit days and months', () => {
    expect(formatDayMonthYear('2026-01-05T12:00:00.000Z')).toBe('05/01/2026');
  });

  it('returns "" for an invalid date string', () => {
    expect(formatDayMonthYear('not-a-date')).toBe('');
  });

  it('returns "" for undefined', () => {
    expect(formatDayMonthYear(undefined)).toBe('');
  });

  it('returns "" for an empty string', () => {
    expect(formatDayMonthYear('')).toBe('');
  });
});
