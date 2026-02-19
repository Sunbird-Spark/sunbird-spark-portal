import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useDebounce from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately without waiting for the delay', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('does not update the value before the delay has elapsed', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });
    act(() => { vi.advanceTimersByTime(299); });

    expect(result.current).toBe('initial');
  });

  it('updates the debounced value after the full delay has elapsed', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });
    act(() => { vi.advanceTimersByTime(300); });

    expect(result.current).toBe('updated');
  });

  it('resets the timer when the value changes before the delay completes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'first' });
    act(() => { vi.advanceTimersByTime(200); }); // Partial delay — not yet committed

    rerender({ value: 'second' }); // New change resets the timer
    act(() => { vi.advanceTimersByTime(200); }); // Still not enough time for 'second'

    expect(result.current).toBe('initial'); // 'first' was cancelled, 'second' not settled yet

    act(() => { vi.advanceTimersByTime(100); }); // Complete the delay for 'second'
    expect(result.current).toBe('second');
  });

  it('skips intermediate values and only commits the latest one', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    act(() => { vi.advanceTimersByTime(100); });
    rerender({ value: 'c' });
    act(() => { vi.advanceTimersByTime(100); });
    rerender({ value: 'd' });
    act(() => { vi.advanceTimersByTime(300); }); // Full delay for 'd'

    expect(result.current).toBe('d'); // Only the last value is emitted
  });

  it('uses the default delay of 300ms when no delay argument is provided', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });
    act(() => { vi.advanceTimersByTime(299); });
    expect(result.current).toBe('initial');

    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe('updated');
  });

  it('clears the pending timer on unmount to prevent state updates after unmount', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = renderHook(() => useDebounce('value', 300));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('works correctly with non-string generic types (number)', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 0 },
    });

    rerender({ value: 42 });
    act(() => { vi.advanceTimersByTime(300); });

    expect(result.current).toBe(42);
  });

  it('respects a custom delay larger than the default', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 800), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });
    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current).toBe('initial'); // 800ms not reached yet

    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('updated'); // 800ms total
  });
});
