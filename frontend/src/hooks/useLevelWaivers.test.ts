import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLevelWaivers } from './useLevelWaivers';

describe('useLevelWaivers', () => {
  it('returns an empty map — no waiver/credit API exists yet', () => {
    const { result } = renderHook(() => useLevelWaivers('lp_1'));
    expect(result.current).toEqual({});
  });

  it('returns an empty map regardless of pathId', () => {
    const { result } = renderHook(() => useLevelWaivers(undefined));
    expect(result.current).toEqual({});
  });
});
