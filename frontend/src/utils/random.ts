/**
 * Cryptographically-seeded random helpers (replacement for Math.random,
 * flagged by SonarQube S2245). Values are drawn from crypto.getRandomValues
 * in batches of 256 so hot paths (per-frame particle spawning) stay cheap.
 */

const BUFFER_SIZE = 256;
const buffer = new Uint32Array(BUFFER_SIZE);
let cursor = BUFFER_SIZE; // force a fill on first use

const UINT32_RANGE = 4294967296; // 2 ** 32

/** Uniform random float in [0, 1), like Math.random. */
export function randomFloat(): number {
  if (cursor >= BUFFER_SIZE) {
    crypto.getRandomValues(buffer);
    cursor = 0;
  }
  const value = buffer[cursor] ?? 0;
  cursor += 1;
  return value / UINT32_RANGE;
}

/** Uniform random float in [min, max). */
export function randomBetween(min: number, max: number): number {
  return min + randomFloat() * (max - min);
}

/** Uniform random integer in [min, maxExclusive). */
export function randomInt(min: number, maxExclusive: number): number {
  return Math.floor(randomBetween(min, maxExclusive));
}
