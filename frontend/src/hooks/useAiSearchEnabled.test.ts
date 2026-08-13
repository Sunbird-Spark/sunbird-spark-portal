import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

/* ── Mock must be hoisted before imports ── */
const mockUseAppInfo = vi.fn();
vi.mock('./useAppInfo', () => ({
  useAppInfo: () => mockUseAppInfo(),
}));

import { useAiSearchEnabled } from './useAiSearchEnabled';

describe('useAiSearchEnabled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults to true when the flag is absent (or app-info not yet loaded)', () => {
    mockUseAppInfo.mockReturnValue({ data: undefined });
    const { result } = renderHook(() => useAiSearchEnabled());
    expect(result.current).toBe(true);
  });

  it('returns true when enableAiSearch is "true"', () => {
    mockUseAppInfo.mockReturnValue({ data: { data: { enableAiSearch: 'true' } } });
    const { result } = renderHook(() => useAiSearchEnabled());
    expect(result.current).toBe(true);
  });

  it('returns false when enableAiSearch is "false"', () => {
    mockUseAppInfo.mockReturnValue({ data: { data: { enableAiSearch: 'false' } } });
    const { result } = renderHook(() => useAiSearchEnabled());
    expect(result.current).toBe(false);
  });
});
