import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getStorageItem, setStorageItem, removeStorageItem } from './storage';

describe('storage utils', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('getStorageItem', () => {
    it('returns the stored value for a given key', () => {
      localStorage.setItem('test-key', 'test-value');
      expect(getStorageItem('test-key')).toBe('test-value');
    });

    it('returns null when the key does not exist', () => {
      expect(getStorageItem('nonexistent-key')).toBeNull();
    });

    it('returns null and warns when localStorage throws', () => {
      vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('storage error');
      });

      const result = getStorageItem('any-key');

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('LocalStorage access failed:', expect.any(Error));
    });
  });

  describe('setStorageItem', () => {
    it('stores the value for a given key', () => {
      setStorageItem('my-key', 'my-value');
      expect(localStorage.getItem('my-key')).toBe('my-value');
    });

    it('silently warns when localStorage throws', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded');
      });

      expect(() => setStorageItem('key', 'value')).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith('LocalStorage write failed:', expect.any(Error));
    });
  });

  describe('removeStorageItem', () => {
    it('removes the stored item for a given key', () => {
      localStorage.setItem('remove-me', 'value');
      removeStorageItem('remove-me');
      expect(localStorage.getItem('remove-me')).toBeNull();
    });

    it('silently warns when localStorage throws', () => {
      vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
        throw new Error('remove error');
      });

      expect(() => removeStorageItem('key')).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith('LocalStorage remove failed:', expect.any(Error));
    });
  });
});
