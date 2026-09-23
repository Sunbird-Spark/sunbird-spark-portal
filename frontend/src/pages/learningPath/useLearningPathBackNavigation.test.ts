import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useLearningPathBackNavigation } from './useLearningPathBackNavigation';

function wrapper(state?: unknown) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      MemoryRouter,
      { initialEntries: [{ pathname: '/learning-path/do_lp', state }] },
      children
    );
}

describe('useLearningPathBackNavigation', () => {
  it('returns location.state.from when present and not another Learning Path route', () => {
    const { result } = renderHook(() => useLearningPathBackNavigation(), {
      wrapper: wrapper({ from: '/my-learning' }),
    });
    expect(result.current).toBe('/my-learning');
  });

  it('falls back to /explore when state.from is missing', () => {
    const { result } = renderHook(() => useLearningPathBackNavigation(), { wrapper: wrapper() });
    expect(result.current).toBe('/explore');
  });

  // Regression: without this, a back button on one LP page could chain back into
  // another LP sub-route (e.g. a level detail page) instead of leaving the flow.
  it('falls back to /explore when state.from is another /learning-path/... route', () => {
    const { result } = renderHook(() => useLearningPathBackNavigation(), {
      wrapper: wrapper({ from: '/learning-path/do_other/level/level_1' }),
    });
    expect(result.current).toBe('/explore');
  });
});
