import { describe, it, expect, vi } from 'vitest';
import { getCookieValue, getUnsignedSessionId, destroySessionId } from '../utils/sessionUtils.js';
import { sessionStore } from '../utils/sessionStore.js';
import * as cookieSignature from 'cookie-signature';
import { envConfig } from '../config/env.js';
import logger from '../utils/logger.js';

// Mock sessionStore
vi.mock('../utils/sessionStore.js', () => ({
  sessionStore: {
    destroy: vi.fn((sid, cb) => {
        if (cb) cb(null);
    })
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
      // cookie package handles decoding automatically
      const header = 'anonymous_cookie=s%3A123.sig';
      expect(getCookieValue(header, 'anonymous_cookie')).toBe('s:123.sig');
    });
  });

  describe('getUnsignedSessionId', () => {
    it('should extract session ID from signed cookie value using secret', () => {
      const sessionId = 'session123';
      // Use real signing to ensure test validity
      const signed = 's:' + cookieSignature.sign(sessionId, envConfig.SUNBIRD_ANONYMOUS_SESSION_SECRET);
      expect(getUnsignedSessionId(signed)).toBe(sessionId);
    });

    it('should return null if signature is invalid', () => {
      const signed = 's:session123.invalidsignature';
      expect(getUnsignedSessionId(signed)).toBeNull();
    });

    it('should return null if empty', () => {
      expect(getUnsignedSessionId('')).toBeNull();
    });

    it('should return original value if not signed (fallback)', () => {
        // If it doesn't start with s:, it returns the value as is
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

    it('should reject and log error if destroy fails', async () => {
      const sid = 'errorSession';
      const error = new Error('Destroy failed');

      // Override mock implementation for this test case
      vi.mocked(sessionStore.destroy).mockImplementationOnce((id, cb) => {
          if (cb) cb(error);
      });

      await expect(destroySessionId(sid)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(`Error destroying session ID ${sid}:`, error);
    });
  });
});
