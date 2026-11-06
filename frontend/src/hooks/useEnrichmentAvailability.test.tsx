import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEnrichmentAvailability } from './useEnrichmentAvailability';
import { init, IHttpClient } from '../lib/http-client';

let mockClient: IHttpClient;
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
const calls = () => (mockClient.post as unknown as { mock: { calls: [string, { request: Record<string, unknown> }][] } }).mock.calls;

describe('useEnrichmentAvailability', () => {
  beforeEach(() => {
    queryClient.clear();
    mockClient = {
      get: vi.fn(),
      post: vi.fn().mockResolvedValue({
        data: { EnrichmentObject: [{ parentId: 'do_1', enrichmentObjectType: 'Transcript' }] },
        status: 200,
        headers: {},
      }),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      updateHeaders: vi.fn(),
    };
    init(mockClient);
  });

  it('searches Live registered enrichment objects for the given ids in one call and maps them by content', async () => {
    const { result } = renderHook(() => useEnrichmentAvailability(['do_2', 'do_1'], true), { wrapper: Wrapper });
    await waitFor(() => expect(result.current).toEqual({ do_1: ['Transcript'] }));
    expect(calls()).toHaveLength(1);
    const { filters, fields, limit } = calls()[0]![1].request as { filters: unknown; fields: unknown; limit: unknown };
    expect(filters).toEqual({
      objectType: 'EnrichmentObject',
      enrichmentObjectType: ['Transcript'],
      status: 'Live',
      parentId: ['do_1', 'do_2'],
    });
    expect(fields).toEqual(['parentId', 'enrichmentObjectType']);
    expect(limit).toBe(40);
  });

  it('does not search while disabled or when there are no ids (negative)', async () => {
    const { result: off } = renderHook(() => useEnrichmentAvailability(['do_1'], false), { wrapper: Wrapper });
    const { result: none } = renderHook(() => useEnrichmentAvailability([], true), { wrapper: Wrapper });
    await new Promise((r) => setTimeout(r, 30));
    expect(mockClient.post).not.toHaveBeenCalled();
    expect(off.current).toEqual({});
    expect(none.current).toEqual({});
  });

  it('leaves the cards without badges when the search fails (negative)', async () => {
    (mockClient.post as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useEnrichmentAvailability(['do_1'], true), { wrapper: Wrapper });
    await waitFor(() => expect(mockClient.post).toHaveBeenCalled());
    expect(result.current).toEqual({});
  });
});
