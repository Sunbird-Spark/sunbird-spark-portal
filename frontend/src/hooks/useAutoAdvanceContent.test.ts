import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutoAdvanceContent, AUTO_ADVANCE_DELAY_MS } from './useAutoAdvanceContent';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

type Args = Parameters<typeof useAutoAdvanceContent>[0];

const render = (initial: Args) => renderHook((props: Args) => useAutoAdvanceContent(props), { initialProps: initial });

describe('useAutoAdvanceContent', () => {
  it('advances when the current content transitions to complete', () => {
    const onAdvance = vi.fn();
    const { rerender } = render({ contentId: 'c1', status: 1, nextContentId: 'c2', onAdvance });
    rerender({ contentId: 'c1', status: 2, nextContentId: 'c2', onAdvance });
    expect(onAdvance).not.toHaveBeenCalled(); // waits for the tick to be seen
    vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS);
    expect(onAdvance).toHaveBeenCalledWith('c2');
  });

  // The regression that would make a finished course unreviewable: the summary
  // reports 2 the instant an already-complete leaf is opened.
  it('does NOT advance when opening content that is already complete', () => {
    const onAdvance = vi.fn();
    render({ contentId: 'c1', status: 2, nextContentId: 'c2', onAdvance });
    vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS * 3);
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('does not advance on the last content, even when it completes', () => {
    const onAdvance = vi.fn();
    const { rerender } = render({ contentId: 'c9', status: 1, nextContentId: undefined, onAdvance });
    rerender({ contentId: 'c9', status: 2, nextContentId: undefined, onAdvance });
    vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS * 3);
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('re-arms after navigating to a new leaf', () => {
    const onAdvance = vi.fn();
    const { rerender } = render({ contentId: 'c1', status: 1, nextContentId: 'c2', onAdvance });
    rerender({ contentId: 'c1', status: 2, nextContentId: 'c2', onAdvance });
    vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS);
    expect(onAdvance).toHaveBeenCalledTimes(1);

    // arriving on c2, which is not complete yet
    rerender({ contentId: 'c2', status: 0, nextContentId: 'c3', onAdvance });
    vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS);
    expect(onAdvance).toHaveBeenCalledTimes(1); // no spurious advance on arrival

    rerender({ contentId: 'c2', status: 2, nextContentId: 'c3', onAdvance });
    vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS);
    expect(onAdvance).toHaveBeenLastCalledWith('c3');
  });

  it('does not advance twice for one completion', () => {
    const onAdvance = vi.fn();
    const { rerender } = render({ contentId: 'c1', status: 1, nextContentId: 'c2', onAdvance });
    rerender({ contentId: 'c1', status: 2, nextContentId: 'c2', onAdvance });
    vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS);
    rerender({ contentId: 'c1', status: 2, nextContentId: 'c2', onAdvance });
    vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS * 3);
    expect(onAdvance).toHaveBeenCalledTimes(1);
  });

  it('stays put when disabled (e.g. not enrolled)', () => {
    const onAdvance = vi.fn();
    const { rerender } = render({ contentId: 'c1', status: 1, nextContentId: 'c2', onAdvance, enabled: false });
    rerender({ contentId: 'c1', status: 2, nextContentId: 'c2', onAdvance, enabled: false });
    vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS * 3);
    expect(onAdvance).not.toHaveBeenCalled();
  });

  it('cancels a pending advance if the learner navigates away first', () => {
    const onAdvance = vi.fn();
    const { rerender } = render({ contentId: 'c1', status: 1, nextContentId: 'c2', onAdvance });
    rerender({ contentId: 'c1', status: 2, nextContentId: 'c2', onAdvance });
    // learner clicks something else before the delay elapses
    rerender({ contentId: 'c5', status: 0, nextContentId: 'c6', onAdvance });
    vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS * 3);
    expect(onAdvance).not.toHaveBeenCalled();
  });
});
