import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import React from 'react';
import useInteract from './useInteract';

// ── Mock useTelemetry ─────────────────────────────────────────────────────────
const mockInteract = vi.fn();

// Stable mock object — same reference on every call (mirrors real context behaviour)
const mockTelemetryService = {
  interact: mockInteract,
  impression: vi.fn(),
  isInitialized: true,
};

vi.mock('@/hooks/useTelemetry', () => ({
  useTelemetry: () => mockTelemetryService,
}));

// ── Wrappers ──────────────────────────────────────────────────────────────────
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/home']}>{children}</MemoryRouter>
);

/** Navigation wrapper — exposes navigate() for programmatic route changes */
let triggerNavigate: (to: string) => void = () => {};

const NavigationCapture = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  triggerNavigate = navigate;
  return <>{children}</>;
};

const navigationWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/home']}>
    <NavigationCapture>{children}</NavigationCapture>
  </MemoryRouter>
);

describe('useInteract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Default type ────────────────────────────────────────────────────────────

  it('uses CLICK as the default type when type is not provided', () => {
    const { result } = renderHook(() => useInteract(), { wrapper });
    act(() => {
      result.current.interact({ id: 'my-button', pageid: 'home' });
    });

    expect(mockInteract).toHaveBeenCalledTimes(1);
    expect(mockInteract).toHaveBeenCalledWith(
      expect.objectContaining({
        edata: expect.objectContaining({ type: 'CLICK', id: 'my-button' }),
      })
    );
  });

  it('uses the provided type when given explicitly', () => {
    const { result } = renderHook(() => useInteract(), { wrapper });
    act(() => {
      result.current.interact({ id: 'search-query', type: 'SEARCH', pageid: 'explore' });
    });

    expect(mockInteract).toHaveBeenCalledWith(
      expect.objectContaining({
        edata: expect.objectContaining({ type: 'SEARCH' }),
      })
    );
  });

  // ── pageid fallback ─────────────────────────────────────────────────────────

  it('falls back to location.pathname when pageid is not provided', () => {
    const { result } = renderHook(() => useInteract(), { wrapper });
    act(() => {
      result.current.interact({ id: 'nav-link' }); // no pageid
    });

    expect(mockInteract).toHaveBeenCalledWith(
      expect.objectContaining({
        edata: expect.objectContaining({ pageid: '/home' }),
      })
    );
  });

  it('uses the provided pageid when given explicitly', () => {
    const { result } = renderHook(() => useInteract(), { wrapper });
    act(() => {
      result.current.interact({ id: 'enroll-btn', pageid: 'collection-detail' });
    });

    expect(mockInteract).toHaveBeenCalledWith(
      expect.objectContaining({
        edata: expect.objectContaining({ pageid: 'collection-detail' }),
      })
    );
  });

  it('pageid fallback updates when route changes', async () => {
    const { result } = renderHook(() => useInteract(), { wrapper: navigationWrapper });

    // Navigate to a new route
    await act(async () => { triggerNavigate('/explore'); });

    act(() => {
      result.current.interact({ id: 'explore-btn' }); // no pageid → should use /explore
    });

    const lastCall = mockInteract.mock.calls[0]![0];
    expect(lastCall.edata.pageid).toBe('/explore');
  });

  // ── cdata → options.context.cdata mapping ───────────────────────────────────

  it('maps cdata to options.context.cdata', () => {
    const { result } = renderHook(() => useInteract(), { wrapper });
    act(() => {
      result.current.interact({
        id: 'collection-unit-toggle',
        pageid: 'collection-detail',
        cdata: [{ id: 'unit-do_123', type: 'Unit' }],
      });
    });

    expect(mockInteract).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { context: { cdata: [{ id: 'unit-do_123', type: 'Unit' }] } },
      })
    );
  });

  it('does not include options.context.cdata when cdata is not provided', () => {
    const { result } = renderHook(() => useInteract(), { wrapper });
    act(() => {
      result.current.interact({ id: 'no-cdata-btn', pageid: 'home' });
    });

    const call = mockInteract.mock.calls[0]![0];
    expect(call.options).toBeUndefined();
  });

  // ── object passthrough ──────────────────────────────────────────────────────

  it('passes object when provided', () => {
    const { result } = renderHook(() => useInteract(), { wrapper });
    act(() => {
      result.current.interact({
        id: 'play-content',
        pageid: 'collection-detail',
        object: { id: 'do_123456', type: 'Content', ver: '1' },
      });
    });

    expect(mockInteract).toHaveBeenCalledWith(
      expect.objectContaining({
        object: { id: 'do_123456', type: 'Content', ver: '1' },
      })
    );
  });

  it('does not include object key when object is not provided', () => {
    const { result } = renderHook(() => useInteract(), { wrapper });
    act(() => {
      result.current.interact({ id: 'some-btn', pageid: 'explore' });
    });

    const call = mockInteract.mock.calls[0]![0];
    expect(call.object).toBeUndefined();
  });

  // ── extra passthrough ───────────────────────────────────────────────────────

  it('passes extra when provided', () => {
    const { result } = renderHook(() => useInteract(), { wrapper });
    act(() => {
      result.current.interact({
        id: 'rate-content',
        pageid: 'course-consumption',
        extra: { rating: 4, contentType: 'Video' },
      });
    });

    expect(mockInteract).toHaveBeenCalledWith(
      expect.objectContaining({
        edata: expect.objectContaining({
          extra: { rating: 4, contentType: 'Video' },
        }),
      })
    );
  });

  // ── Stable reference (useCallback) ─────────────────────────────────────────

  it('returns the same interact function reference across re-renders (on same route)', () => {
    const { result, rerender } = renderHook(() => useInteract(), { wrapper });
    const firstRef = result.current.interact;
    rerender();
    expect(result.current.interact).toBe(firstRef);
  });

  // ── Combined payload ────────────────────────────────────────────────────────

  it('builds a complete payload with all optional fields', () => {
    const { result } = renderHook(() => useInteract(), { wrapper });
    act(() => {
      result.current.interact({
        id: 'full-interaction',
        type: 'TOUCH',
        pageid: 'workspace',
        extra: { key: 'value' },
        object: { id: 'do_789', type: 'Collection', ver: '2' },
        cdata: [{ id: 'batch-001', type: 'CourseBatch' }],
      });
    });

    expect(mockInteract).toHaveBeenCalledWith({
      edata: {
        type: 'TOUCH',
        id: 'full-interaction',
        pageid: 'workspace',
        extra: { key: 'value' },
      },
      object: { id: 'do_789', type: 'Collection', ver: '2' },
      options: { context: { cdata: [{ id: 'batch-001', type: 'CourseBatch' }] } },
    });
  });
});
