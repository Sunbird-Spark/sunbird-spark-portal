import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRatingTimer } from './useRatingTimer';

describe('useRatingTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls onOpen after the delay when onContentEnd is invoked', () => {
    vi.useFakeTimers();
    const onOpen = vi.fn();
    const { result } = renderHook(() => useRatingTimer(onOpen, 5000));

    act(() => { result.current.onContentEnd(); });
    expect(onOpen).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onOpen).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('does not call onOpen before the delay elapses', () => {
    vi.useFakeTimers();
    const onOpen = vi.fn();
    const { result } = renderHook(() => useRatingTimer(onOpen, 5000));

    act(() => { result.current.onContentEnd(); });
    act(() => { vi.advanceTimersByTime(4999); });
    expect(onOpen).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('cancels the pending timer when onContentStart is called before delay', () => {
    vi.useFakeTimers();
    const onOpen = vi.fn();
    const { result } = renderHook(() => useRatingTimer(onOpen, 5000));

    act(() => { result.current.onContentEnd(); });
    act(() => { vi.advanceTimersByTime(2000); });
    act(() => { result.current.onContentStart(); });
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onOpen).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('fires after the next onContentEnd following a cancelled timer', () => {
    vi.useFakeTimers();
    const onOpen = vi.fn();
    const { result } = renderHook(() => useRatingTimer(onOpen, 5000));

    act(() => { result.current.onContentEnd(); });
    act(() => { vi.advanceTimersByTime(2000); });
    act(() => { result.current.onContentStart(); });
    act(() => { result.current.onContentEnd(); });
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onOpen).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('resets the timer if onContentEnd fires again before delay', () => {
    vi.useFakeTimers();
    const onOpen = vi.fn();
    const { result } = renderHook(() => useRatingTimer(onOpen, 5000));

    act(() => { result.current.onContentEnd(); });
    act(() => { vi.advanceTimersByTime(3000); });
    // Second END resets the timer
    act(() => { result.current.onContentEnd(); });
    act(() => { vi.advanceTimersByTime(4999); });
    expect(onOpen).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(onOpen).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('clears the timer on unmount without calling onOpen', () => {
    vi.useFakeTimers();
    const onOpen = vi.fn();
    const { result, unmount } = renderHook(() => useRatingTimer(onOpen, 5000));

    act(() => { result.current.onContentEnd(); });
    unmount();
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onOpen).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
