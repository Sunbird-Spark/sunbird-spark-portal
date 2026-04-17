import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFancytreeGuard } from './useFancytreeGuard';

describe('useFancytreeGuard', () => {
  let originalDescriptors: Map<string, PropertyDescriptor | undefined>;

  beforeEach(() => {
    // Save original descriptors
    originalDescriptors = new Map();
    for (const key of ['$', 'jQuery'] as const) {
      originalDescriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    }
  });

  afterEach(() => {
    // Restore originals
    for (const [key, desc] of originalDescriptors) {
      if (desc) {
        Object.defineProperty(globalThis, key, desc);
      } else {
        try {
          delete (globalThis as any)[key];
        } catch {
          // ignore
        }
      }
    }
  });

  it('should not install traps when disabled', () => {
    const fakeJQuery = { fn: { fancytree: true } };
    (globalThis as any).$ = fakeJQuery;

    renderHook(() => useFancytreeGuard(false));

    // Should still be a plain data property, not a getter/setter
    const desc = Object.getOwnPropertyDescriptor(globalThis, '$');
    expect(desc?.get).toBeUndefined();
  });

  it('should install getter/setter traps when enabled', () => {
    const fakeJQuery = { fn: { fancytree: true } };
    (globalThis as any).$ = fakeJQuery;
    (globalThis as any).jQuery = fakeJQuery;

    renderHook(() => useFancytreeGuard(true));

    const descDollar = Object.getOwnPropertyDescriptor(globalThis, '$');
    const descJQuery = Object.getOwnPropertyDescriptor(globalThis, 'jQuery');
    expect(descDollar?.get).toBeDefined();
    expect(descDollar?.set).toBeDefined();
    expect(descJQuery?.get).toBeDefined();
    expect(descJQuery?.set).toBeDefined();
  });

  it('should preserve FancyTree-capable jQuery when overwritten with plain jQuery', () => {
    const fancytreeJQuery = { fn: { fancytree: true, other: true } };
    const plainJQuery = { fn: {} };

    (globalThis as any).$ = fancytreeJQuery;
    (globalThis as any).jQuery = fancytreeJQuery;

    renderHook(() => useFancytreeGuard(true));

    // Overwrite with plain jQuery (simulating editor bundle)
    (globalThis as any).$ = plainJQuery;

    // Should still return the FancyTree-capable version
    expect((globalThis as any).$.fn.fancytree).toBe(true);
  });

  it('should accept incoming jQuery if it has FancyTree', () => {
    const fancytreeJQueryV1 = { fn: { fancytree: true }, version: '1' };
    const fancytreeJQueryV2 = { fn: { fancytree: true }, version: '2' };

    (globalThis as any).$ = fancytreeJQueryV1;

    renderHook(() => useFancytreeGuard(true));

    // Overwrite with another FancyTree-capable jQuery
    (globalThis as any).$ = fancytreeJQueryV2;

    expect((globalThis as any).$.version).toBe('2');
  });

  it('falls back to incoming when fancytreeJQueryRef is null at write time (line 72 ?? branch)', () => {
    // Start with NO fancytree jQuery on the global — so fancytreeJQueryRef stays null
    delete (globalThis as any).$;
    delete (globalThis as any).jQuery;

    renderHook(() => useFancytreeGuard(true));

    // Now write a plain jQuery (no fancytree) — fancytreeJQueryRef is null → falls back to incoming
    const plainJQuery = { fn: {} };
    (globalThis as any).$ = plainJQuery;

    // Since fancytreeJQueryRef is null, it keeps the incoming value
    expect((globalThis as any).$).toBe(plainJQuery);
  });

  it('should restore original descriptors on unmount', () => {
    const fakeJQuery = { fn: { fancytree: true } };
    (globalThis as any).$ = fakeJQuery;

    const { unmount } = renderHook(() => useFancytreeGuard(true));

    // Verify trap is installed
    expect(Object.getOwnPropertyDescriptor(globalThis, '$')?.get).toBeDefined();

    unmount();

    // After unmount, the trap should be removed
    const desc = Object.getOwnPropertyDescriptor(globalThis, '$');
    expect(desc?.get).toBeUndefined();
  });
});
