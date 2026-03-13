import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePageSession } from './usePageSession';

// ── Mock useTelemetry ─────────────────────────────────────────────────────────
const mockStart = vi.fn();
const mockEnd = vi.fn();

vi.mock('@/hooks/useTelemetry', () => ({
  useTelemetry: () => ({
    start: mockStart,
    end: mockEnd,
    impression: vi.fn(),
    interact: vi.fn(),
    audit: vi.fn(),
    error: vi.fn(),
    share: vi.fn(),
    log: vi.fn(),
    exData: vi.fn(),
    feedback: vi.fn(),
    isInitialized: true,
  }),
}));

describe('usePageSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── START event ─────────────────────────────────────────────────────────────

  it('fires START on mount with pageid, type, and mode', () => {
    renderHook(() => usePageSession({ pageid: 'content-player' }));

    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledWith(
      {},
      'content-player',
      '1.0',
      { type: 'view', mode: 'play', pageid: 'content-player' }
    );
  });

  it('uses object.id as contentId when object is provided', () => {
    renderHook(() =>
      usePageSession({ pageid: 'content-player', object: { id: 'do_123', type: 'Content' } })
    );

    expect(mockStart).toHaveBeenCalledWith(
      {},
      'do_123',
      '1.0',
      { type: 'view', mode: 'play', pageid: 'content-player' }
    );
  });

  it('uses object.ver in START when provided', () => {
    renderHook(() =>
      usePageSession({ pageid: 'content-player', object: { id: 'do_123', type: 'Content', ver: '2.0' } })
    );

    expect(mockStart).toHaveBeenCalledWith(
      {},
      'do_123',
      '2.0',
      expect.any(Object)
    );
  });

  it('falls back to pageid as contentId when no object given', () => {
    renderHook(() => usePageSession({ pageid: 'workspace' }));

    expect(mockStart).toHaveBeenCalledWith(
      {},
      'workspace',
      '1.0',
      expect.any(Object)
    );
  });

  it('respects custom type and mode', () => {
    renderHook(() =>
      usePageSession({ pageid: 'content-editor', type: 'edit', mode: 'edit' })
    );

    expect(mockStart).toHaveBeenCalledWith(
      {},
      'content-editor',
      '1.0',
      { type: 'edit', mode: 'edit', pageid: 'content-editor' }
    );
  });

  // ── END event ───────────────────────────────────────────────────────────────

  it('does NOT fire END before unmount', () => {
    renderHook(() => usePageSession({ pageid: 'content-player' }));
    expect(mockEnd).not.toHaveBeenCalled();
  });

  it('fires END on unmount with correct pageid', () => {
    const { unmount } = renderHook(() => usePageSession({ pageid: 'content-player' }));
    unmount();

    expect(mockEnd).toHaveBeenCalledTimes(1);
    expect(mockEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        edata: expect.objectContaining({
          pageid: 'content-player',
          type: 'view',
          mode: 'play',
        }),
      })
    );
  });

  it('calculates elapsed duration in seconds on unmount', () => {
    vi.setSystemTime(1000);
    const { unmount } = renderHook(() => usePageSession({ pageid: 'content-player' }));

    vi.setSystemTime(6000); // 5 seconds later
    unmount();

    const { duration } = mockEnd.mock.calls[0]![0].edata;
    expect(duration).toBe(5.0);
  });

  it('rounds duration to 3 decimal places', () => {
    vi.setSystemTime(0);
    const { unmount } = renderHook(() => usePageSession({ pageid: 'content-player' }));

    vi.setSystemTime(1234); // 1.234 seconds
    unmount();

    const { duration } = mockEnd.mock.calls[0]![0].edata;
    expect(duration).toBe(1.234);
  });

  it('includes object in END when object is provided', () => {
    const { unmount } = renderHook(() =>
      usePageSession({ pageid: 'content-player', object: { id: 'do_123', type: 'Content' } })
    );
    unmount();

    expect(mockEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        object: { id: 'do_123', type: 'Content', ver: '1.0' },
      })
    );
  });

  it('uses object.ver in END when provided', () => {
    const { unmount } = renderHook(() =>
      usePageSession({ pageid: 'content-player', object: { id: 'do_123', type: 'Content', ver: '3.0' } })
    );
    unmount();

    expect(mockEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        object: expect.objectContaining({ ver: '3.0' }),
      })
    );
  });

  it('does NOT include object in END when no object given', () => {
    const { unmount } = renderHook(() => usePageSession({ pageid: 'workspace' }));
    unmount();

    const call = mockEnd.mock.calls[0]![0];
    expect(call.object).toBeUndefined();
  });

  // ── Re-fire on dependency change ────────────────────────────────────────────

  it('re-fires START and END when pageid changes', () => {
    let pageid = 'page-one';
    const { rerender, unmount } = renderHook(() => usePageSession({ pageid }));

    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(mockEnd).not.toHaveBeenCalled();

    pageid = 'page-two';
    rerender();

    // cleanup (END for page-one) + new effect (START for page-two)
    expect(mockEnd).toHaveBeenCalledTimes(1);
    expect(mockEnd.mock.calls[0]![0].edata.pageid).toBe('page-one');
    expect(mockStart).toHaveBeenCalledTimes(2);

    unmount();
    expect(mockEnd).toHaveBeenCalledTimes(2);
    expect(mockEnd.mock.calls[1]![0].edata.pageid).toBe('page-two');
  });

  it('re-fires START and END when object.id changes', () => {
    let objectId = 'do_001';
    const { rerender, unmount } = renderHook(() =>
      usePageSession({ pageid: 'content-player', object: { id: objectId, type: 'Content' } })
    );

    expect(mockStart).toHaveBeenCalledTimes(1);
    objectId = 'do_002';
    rerender();

    expect(mockEnd).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledTimes(2);

    unmount();
    expect(mockEnd).toHaveBeenCalledTimes(2);
  });

  it('does NOT re-fire when unrelated props change (type/mode)', () => {
    let type = 'view';
    const { rerender } = renderHook(() =>
      usePageSession({ pageid: 'workspace', type })
    );

    type = 'edit';
    rerender();

    // pageid and object.id unchanged → no re-fire
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(mockEnd).toHaveBeenCalledTimes(0);
  });
});
