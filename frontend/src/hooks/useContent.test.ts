import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuery } from '@tanstack/react-query';
import { useContentSearch, useContentRead } from './useContent';

const { mockContentSearch, mockContentRead } = vi.hoisted(() => ({
  mockContentSearch: vi.fn(),
  mockContentRead: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('../services/ContentService', () => ({
  ContentService: class {
    contentSearch = mockContentSearch;
    contentRead = mockContentRead;
  },
}));

describe('useContentSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQuery).mockImplementation((opts) => opts as unknown as ReturnType<typeof useQuery>);
  });

  it('is enabled by default', () => {
    renderHook(() => useContentSearch());
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    expect(call.enabled).toBe(true);
  });

  it('respects the enabled option when false', () => {
    renderHook(() => useContentSearch({ enabled: false }));
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    expect(call.enabled).toBe(false);
  });

  it('uses content-search queryKey prefix', () => {
    renderHook(() => useContentSearch({ request: { query: 'hello', limit: 10, offset: 0 } }));
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    expect(call.queryKey[0]).toBe('content-search');
  });

  it('includes request query and limit in queryKey', () => {
    renderHook(() => useContentSearch({ request: { query: 'maths', limit: 20, offset: 5 } }));
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    expect(call.queryKey[1]).toBe('maths');
    expect(call.queryKey[3]).toBe(20);
  });

  it('injects DEFAULT_PRIMARY_CATEGORIES when primaryCategory filter is empty', () => {
    renderHook(() =>
      useContentSearch({ request: { query: '', limit: 10, offset: 0, filters: { status: ['Live'] } } })
    );
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    const filtersStr = call.queryKey[5] as string;
    expect(filtersStr).toContain('Collection');
    expect(filtersStr).toContain('Course');
  });

  it('does NOT inject DEFAULT_PRIMARY_CATEGORIES when primaryCategory is already set', () => {
    renderHook(() =>
      useContentSearch({
        request: {
          query: '',
          limit: 10,
          offset: 0,
          filters: { primaryCategory: ['Resource'] },
        },
      })
    );
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    const filtersStr = call.queryKey[5] as string;
    const parsed = JSON.parse(filtersStr);
    expect(parsed.primaryCategory).toEqual(['Resource']);
    // Should NOT have been expanded to the default list
    expect(parsed.primaryCategory.length).toBe(1);
  });

  it('does NOT inject DEFAULT_PRIMARY_CATEGORIES when primaryCategory is a non-empty string', () => {
    renderHook(() =>
      useContentSearch({
        request: {
          query: '',
          limit: 10,
          offset: 0,
          filters: { primaryCategory: 'Course' as unknown as string[] },
        },
      })
    );
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    const filtersStr = call.queryKey[5] as string;
    const parsed = JSON.parse(filtersStr);
    expect(parsed.primaryCategory).toBe('Course');
  });

  it('passes the request to contentService.contentSearch via queryFn', () => {
    mockContentSearch.mockResolvedValue({ data: {} });
    renderHook(() => useContentSearch({ request: { query: 'test', limit: 5, offset: 0 } }));
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    (call.queryFn as () => void)();
    expect(mockContentSearch).toHaveBeenCalled();
  });

  it('handles undefined request (no filters to inject)', () => {
    renderHook(() => useContentSearch());
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    // Should not throw
    expect(call.queryKey[0]).toBe('content-search');
  });
});

describe('useContentRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQuery).mockImplementation((opts) => opts as unknown as ReturnType<typeof useQuery>);
  });

  it('uses content-read queryKey with contentId, fields, and mode', () => {
    renderHook(() => useContentRead('content-abc', { fields: ['name', 'description'], mode: 'edit' }));
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    expect(call.queryKey).toEqual(['content-read', 'content-abc', ['name', 'description'], 'edit']);
  });

  it('is enabled when contentId is non-empty', () => {
    renderHook(() => useContentRead('content-abc'));
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    expect(call.enabled).toBe(true);
  });

  it('is disabled when contentId is empty string', () => {
    renderHook(() => useContentRead(''));
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    expect(call.enabled).toBe(false);
  });

  it('is disabled when enabled option is false', () => {
    renderHook(() => useContentRead('content-abc', { enabled: false }));
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    expect(call.enabled).toBe(false);
  });

  it('calls contentService.contentRead with correct params via queryFn', () => {
    mockContentRead.mockResolvedValue({ data: {} });
    renderHook(() => useContentRead('c-123', { fields: ['name'], mode: 'view' }));
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    (call.queryFn as () => void)();
    expect(mockContentRead).toHaveBeenCalledWith('c-123', ['name'], 'view');
  });

  it('has 1 hour staleTime', () => {
    renderHook(() => useContentRead('c-123'));
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    expect(call.staleTime).toBe(60 * 60 * 1000);
  });
});
