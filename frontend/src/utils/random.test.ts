import { describe, it, expect, vi, afterEach } from 'vitest';
import { randomFloat, randomBetween, randomInt } from './random';

describe('random utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('randomFloat returns values in [0, 1)', () => {
    for (let i = 0; i < 1000; i += 1) {
      const value = randomFloat();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('refills the entropy buffer in batches rather than per call', () => {
    const spy = vi.spyOn(crypto, 'getRandomValues');
    for (let i = 0; i < 512; i += 1) {
      randomFloat();
    }
    // 512 draws need at most 3 refills of the 256-value buffer
    // (including one partial batch left over from earlier draws).
    expect(spy.mock.calls.length).toBeLessThanOrEqual(3);
  });

  it('randomBetween stays within [min, max)', () => {
    for (let i = 0; i < 500; i += 1) {
      const value = randomBetween(5, 10);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThan(10);
    }
  });

  it('randomInt returns integers within [min, maxExclusive)', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 500; i += 1) {
      const value = randomInt(1, 4);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThan(4);
      seen.add(value);
    }
    // With 500 draws over 3 buckets, more than one bucket must appear.
    expect(seen.size).toBeGreaterThan(1);
  });
});
