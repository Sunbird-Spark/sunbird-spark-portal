import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEnrichmentAvailability, AVAILABILITY_CHUNK_SIZE } from './useEnrichmentAvailability';
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

  it('searches in chunks and, when more ids load, only searches the new ids', async () => {
    const ids = (from: number, to: number) => Array.from({ length: to - from }, (_, i) => `do_${from + i}`);
    const { rerender } = renderHook(({ list }) => useEnrichmentAvailability(list, true), {
      wrapper: Wrapper,
      initialProps: { list: ids(0, AVAILABILITY_CHUNK_SIZE) },
    });
    await waitFor(() => expect(calls()).toHaveLength(1));
    expect((calls()[0]![1].request.filters as { parentId: string[] }).parentId).toHaveLength(AVAILABILITY_CHUNK_SIZE);
    expect(calls()[0]![1].request.limit).toBe(AVAILABILITY_CHUNK_SIZE * 20);

    rerender({ list: ids(0, AVAILABILITY_CHUNK_SIZE * 2) });
    await waitFor(() => expect(calls()).toHaveLength(2));
    const second = (calls()[1]![1].request.filters as { parentId: string[] }).parentId;
    expect(second).toEqual(ids(AVAILABILITY_CHUNK_SIZE, AVAILABILITY_CHUNK_SIZE * 2).sort((a, b) => a.localeCompare(b)));
  });

  it('merges the results of every chunk', async () => {
    (mockClient.post as ReturnType<typeof vi.fn>).mockImplementation((_url: string, body: { request: { filters: { parentId: string[] } } }) =>
      Promise.resolve({
        data: { EnrichmentObject: [{ parentId: body.request.filters.parentId[0], enrichmentObjectType: 'Transcript' }] },
        status: 200,
        headers: {},
      }),
    );
    const list = Array.from({ length: AVAILABILITY_CHUNK_SIZE + 1 }, (_, i) => `do_${String(i).padStart(3, '0')}`);
    const { result } = renderHook(() => useEnrichmentAvailability(list, true), { wrapper: Wrapper });
    await waitFor(() => expect(Object.keys(result.current)).toHaveLength(2));
    expect(result.current).toEqual({ do_000: ['Transcript'], [`do_${String(AVAILABILITY_CHUNK_SIZE).padStart(3, '0')}`]: ['Transcript'] });
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
