import { describe, it, expect, vi } from 'vitest';
import { getCookieValue, getUnsignedSessionId, destroySessionId } from '../utils/sessionUtils.js';
import { sessionStore } from '../utils/sessionStore.js';

// Mock sessionStore
vi.mock('../utils/sessionStore.js', () => ({
  sessionStore: {
    destroy: vi.fn((sid, cb) => cb(null))
  }
}));

// Mock logger
vi.mock('../utils/logger.js', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }
}));

describe('Session Utils', () => {
  describe('getCookieValue', () => {
    it('should retrieve cookie value from header string', () => {
      const header = 'other=xyz; anonymous_cookie=s:123.sig; auth_cookie=abc';
      expect(getCookieValue(header, 'anonymous_cookie')).toBe('s:123.sig');
    });

    it('should return null if cookie not found', () => {
      const header = 'other=xyz; auth_cookie=abc';
      expect(getCookieValue(header, 'anonymous_cookie')).toBeNull();
    });

    it('should handle empty header', () => {
      expect(getCookieValue('', 'anonymous_cookie')).toBeNull();
    });

    it('should handle URI encoded values', () => {
      const header = 'anonymous_cookie=s%3A123.sig';
      expect(getCookieValue(header, 'anonymous_cookie')).toBe('s:123.sig');
    });
  });

  describe('getUnsignedSessionId', () => {
    it('should extract session ID from signed cookie value', () => {
      const value = 's:session123.signature';
      expect(getUnsignedSessionId(value)).toBe('session123');
    });

    it('should return null if empty', () => {
      expect(getUnsignedSessionId('')).toBeNull();
    });

    it('should return original value if not signed (fallback)', () => {
      const value = 'plainvalue';
      expect(getUnsignedSessionId(value)).toBe('plainvalue');
    });

    it('should return null if undefined/null passed', () => {
        expect(getUnsignedSessionId(undefined as any)).toBeNull();
        expect(getUnsignedSessionId(null as any)).toBeNull();
    });
  });

  describe('destroySessionId', () => {
    it('should call sessionStore.destroy with correct ID', async () => {
      const sid = 'session123';
      await destroySessionId(sid);
      expect(sessionStore.destroy).toHaveBeenCalledWith(sid, expect.any(Function));
    });
  });
});
