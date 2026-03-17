import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NavigationHelperService } from './NavigationHelperService';

describe('NavigationHelperService', () => {
  let service: NavigationHelperService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new NavigationHelperService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── getPageLoadTime ────────────────────────────────────────────────────────

  describe('getPageLoadTime()', () => {
    it('returns elapsed seconds since pageStartTime', () => {
      vi.setSystemTime(1000);
      service.resetPageStartTime();

      vi.setSystemTime(2500); // 1.5s later
      expect(service.getPageLoadTime()).toBe(1.5);
    });

    it('returns 0 when called immediately after pageStartTime is set', () => {
      vi.setSystemTime(5000);
      service.resetPageStartTime();
      expect(service.getPageLoadTime()).toBe(0);
    });

    it('reflects updated pageStartTime when reassigned', () => {
      vi.setSystemTime(1000);
      service.resetPageStartTime();

      vi.setSystemTime(3000); // 2s elapsed
      service.resetPageStartTime(); // reset

      vi.setSystemTime(3500); // 0.5s after reset
      expect(service.getPageLoadTime()).toBe(0.5);
    });
  });

  // ─── storeUrlHistory ────────────────────────────────────────────────────────

  describe('storeUrlHistory()', () => {
    it('pushes the first URL into history', () => {
      service.storeUrlHistory('/home');
      expect(service.getPreviousUrl()).toBeUndefined(); // only 1 entry, no "previous"
    });

    it('grows history when URLs differ', () => {
      service.storeUrlHistory('/home');
      service.storeUrlHistory('/explore');
      expect(service.getPreviousUrl()).toBe('/home');
    });

    it('does NOT grow history when the same URL is pushed twice (refresh / same-page link)', () => {
      service.storeUrlHistory('/home');
      service.storeUrlHistory('/home'); // same URL again
      // History stays at 1 entry — no previous
      expect(service.getPreviousUrl()).toBeUndefined();
    });

    it('correctly tracks multiple distinct navigations', () => {
      service.storeUrlHistory('/home');
      service.storeUrlHistory('/explore');
      service.storeUrlHistory('/profile');
      expect(service.getPreviousUrl()).toBe('/explore');
    });

    it('handles refresh mid-session without corrupting history', () => {
      service.storeUrlHistory('/home');
      service.storeUrlHistory('/explore');
      service.storeUrlHistory('/explore'); // refresh
      // Still 2 entries: /home + /explore
      expect(service.getPreviousUrl()).toBe('/home');
    });
  });

  // ─── getPreviousUrl ─────────────────────────────────────────────────────────

  describe('getPreviousUrl()', () => {
    it('returns undefined when history has only one entry', () => {
      service.storeUrlHistory('/home');
      expect(service.getPreviousUrl()).toBeUndefined();
    });

    it('returns the second-to-last URL after two distinct navigations', () => {
      service.storeUrlHistory('/home');
      service.storeUrlHistory('/explore');
      expect(service.getPreviousUrl()).toBe('/home');
    });
  });

  // ─── shouldProcessNavigationClick ──────────────────────────────────────────

  describe('shouldProcessNavigationClick()', () => {
    it('returns true on the first call (no previous click)', () => {
      vi.setSystemTime(10000);
      expect(service.shouldProcessNavigationClick()).toBe(true);
    });

    it('returns false when called again within 250ms (throttled)', () => {
      vi.setSystemTime(10000);
      service.shouldProcessNavigationClick(); // first — sets _lastNavigationClickTime

      vi.setSystemTime(10100); // 100ms later — within throttle window
      expect(service.shouldProcessNavigationClick()).toBe(false);
    });

    it('returns false at exactly the 250ms boundary (exclusive)', () => {
      vi.setSystemTime(10000);
      service.shouldProcessNavigationClick();

      vi.setSystemTime(10249); // 249ms later — still throttled
      expect(service.shouldProcessNavigationClick()).toBe(false);
    });

    it('returns true after 250ms have elapsed', () => {
      vi.setSystemTime(10000);
      service.shouldProcessNavigationClick();

      vi.setSystemTime(10250); // exactly 250ms later — no longer throttled
      expect(service.shouldProcessNavigationClick()).toBe(true);
    });

    it('resets the throttle window after a successful click', () => {
      vi.setSystemTime(10000);
      service.shouldProcessNavigationClick(); // click 1

      vi.setSystemTime(10300); // after window
      service.shouldProcessNavigationClick(); // click 2 resets window

      vi.setSystemTime(10400); // 100ms after click 2 — throttled again
      expect(service.shouldProcessNavigationClick()).toBe(false);
    });
  });
});
