import { createHash, timingSafeEqual } from 'crypto';

/** Constant-time string comparison. Hashing both sides to a fixed-length digest
 * first avoids timingSafeEqual's equal-length requirement (and the length-leaking
 * exception it throws otherwise) while still comparing in constant time. */
export function safeCompare(a: string, b: string): boolean {
    const digestA = createHash('sha256').update(a).digest();
    const digestB = createHash('sha256').update(b).digest();
    return timingSafeEqual(digestA, digestB);
}
