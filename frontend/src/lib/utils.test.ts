import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatTimeAgo } from './utils';

describe('formatTimeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns relative time for valid Date object', () => {
    const past = new Date('2024-06-14T12:00:00.000Z');
    const result = formatTimeAgo(past);
    expect(result).not.toBe('Invalid date');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/ago|minute|hour|day|month|year/);
  });

  it('returns relative time for valid ISO date string', () => {
    const result = formatTimeAgo('2024-06-10T00:00:00.000Z');
    expect(result).not.toBe('Invalid date');
    expect(typeof result).toBe('string');
    expect(result).toMatch(/ago|minute|hour|day|month|year/);
  });

  it('returns relative time for valid timestamp number', () => {
    const timestamp = new Date('2024-06-01T12:00:00.000Z').getTime();
    const result = formatTimeAgo(timestamp);
    expect(result).not.toBe('Invalid date');
    expect(typeof result).toBe('string');
    expect(result).toMatch(/ago|minute|hour|day|month|year/);
  });

  it('returns "Invalid date" for invalid date string', () => {
    expect(formatTimeAgo('not-a-date')).toBe('Invalid date');
    expect(formatTimeAgo('')).toBe('Invalid date');
  });

  it('returns "Invalid date" for Invalid Date object', () => {
    expect(formatTimeAgo(new Date(NaN))).toBe('Invalid date');
  });

  it('returns "Invalid date" for NaN as number', () => {
    expect(formatTimeAgo(NaN as unknown as number)).toBe('Invalid date');
  });

  it('handles date that parses to invalid after format', () => {
    const result = formatTimeAgo('invalid');
    expect(result).toBe('Invalid date');
  });
});
