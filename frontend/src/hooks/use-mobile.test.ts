import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from './use-mobile';

const MOBILE_BREAKPOINT = 768;

// matchMedia is not implemented in happy-dom; we provide a mock implementation.
function createMatchMediaMock(matches: boolean) {
  const listeners: Array<() => void> = [];
  return {
    matches,
    addEventListener: vi.fn((_event: string, cb: () => void) => {
      listeners.push(cb);
    }),
    removeEventListener: vi.fn((_event: string, cb: () => void) => {
      const idx = listeners.indexOf(cb);
      if (idx !== -1) listeners.splice(idx, 1);
    }),
    _triggerChange: () => listeners.forEach((cb) => cb()),
  };
}

describe('useIsMobile', () => {
  let originalMatchMedia: typeof window.matchMedia;
  let originalInnerWidth: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    originalInnerWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth');
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    if (originalInnerWidth) {
      Object.defineProperty(window, 'innerWidth', originalInnerWidth);
    }
    vi.restoreAllMocks();
  });

  function setWindowWidth(width: number) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
  }

  describe('initial value', () => {
    it('returns true when window.innerWidth is less than 768', () => {
      setWindowWidth(375);
      const mql = createMatchMediaMock(true);
      window.matchMedia = vi.fn().mockReturnValue(mql);

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('returns false when window.innerWidth is 768 or more', () => {
      setWindowWidth(1024);
      const mql = createMatchMediaMock(false);
      window.matchMedia = vi.fn().mockReturnValue(mql);

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('returns false exactly at the breakpoint boundary (768)', () => {
      setWindowWidth(MOBILE_BREAKPOINT);
      const mql = createMatchMediaMock(false);
      window.matchMedia = vi.fn().mockReturnValue(mql);

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('returns true one pixel below the breakpoint (767)', () => {
      setWindowWidth(MOBILE_BREAKPOINT - 1);
      const mql = createMatchMediaMock(true);
      window.matchMedia = vi.fn().mockReturnValue(mql);

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });
  });

  describe('matchMedia query string', () => {
    it('creates a media query with (max-width: 767px)', () => {
      setWindowWidth(1024);
      const mql = createMatchMediaMock(false);
      const matchMediaFn = vi.fn().mockReturnValue(mql);
      window.matchMedia = matchMediaFn;

      renderHook(() => useIsMobile());
      expect(matchMediaFn).toHaveBeenCalledWith(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    });
  });

  describe('resize event handling — line 13 branch', () => {
    it('updates to true when the mediaQuery fires and innerWidth is now < 768', () => {
      // Start desktop
      setWindowWidth(1024);
      const mql = createMatchMediaMock(false);
      window.matchMedia = vi.fn().mockReturnValue(mql);

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);

      // Simulate a resize to mobile
      act(() => {
        setWindowWidth(375);
        mql._triggerChange();
      });

      expect(result.current).toBe(true);
    });

    it('updates to false when the mediaQuery fires and innerWidth is now >= 768', () => {
      // Start mobile
      setWindowWidth(375);
      const mql = createMatchMediaMock(true);
      window.matchMedia = vi.fn().mockReturnValue(mql);

      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);

      // Simulate a resize to desktop
      act(() => {
        setWindowWidth(1200);
        mql._triggerChange();
      });

      expect(result.current).toBe(false);
    });
  });

  describe('event listener cleanup', () => {
    it('registers addEventListener on the mediaQueryList', () => {
      setWindowWidth(500);
      const mql = createMatchMediaMock(true);
      window.matchMedia = vi.fn().mockReturnValue(mql);

      const { unmount } = renderHook(() => useIsMobile());
      expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      unmount();
    });

    it('removes the event listener on unmount', () => {
      setWindowWidth(500);
      const mql = createMatchMediaMock(true);
      window.matchMedia = vi.fn().mockReturnValue(mql);

      const { unmount } = renderHook(() => useIsMobile());
      unmount();
      expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });
});
