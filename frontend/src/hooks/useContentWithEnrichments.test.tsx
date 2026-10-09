import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useContentWithEnrichments } from './useContentWithEnrichments';

const { mockContentRead, mockListForTypes } = vi.hoisted(() => ({
  mockContentRead: vi.fn(),
  mockListForTypes: vi.fn(),
}));

vi.mock('../services/ContentService', () => ({
  ContentService: class {
    contentRead = mockContentRead;
    contentSearch = vi.fn();
    semanticSearch = vi.fn();
  },
}));

vi.mock('@/services/EnrichmentObjectService', () => ({
  enrichmentObjectService: { listForTypes: (...args: unknown[]) => mockListForTypes(...args) },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const readResponse = (content: Record<string, unknown>) => ({ data: { content }, status: 200, headers: {} });

const liveTranscript = {
  identifier: 't1',
  enrichmentObjectType: 'Transcript',
  parentId: 'do_1',
  status: 'Live',
  language: 'English',
  languageCode: 'en',
  sourceLanguage: true,
  captionsUrl: 'https://blob/en/captions.vtt',
};

describe('useContentWithEnrichments', () => {
  beforeEach(() => {
    queryClient.clear();
    mockContentRead.mockReset();
    mockListForTypes.mockReset();
  });

  it('lists the enrichment objects after the read and merges the Live transcripts into the content', async () => {
    mockContentRead.mockResolvedValue(readResponse({ identifier: 'do_1', mimeType: 'video/mp4' }));
    mockListForTypes.mockResolvedValue([liveTranscript]);

    const { result } = renderHook(() => useContentWithEnrichments('do_1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockListForTypes).toHaveBeenCalledWith('do_1', ['Transcript']);
    expect(result.current.content).toMatchObject({
      identifier: 'do_1',
      transcripts: [{ identifier: 't1', artifactUrl: 'https://blob/en/captions.vtt' }],
    });
    expect(result.current.error).toBeNull();
  });

  it('never lists for a mimeType no enrichment applies to (negative)', async () => {
    mockContentRead.mockResolvedValue(readResponse({ identifier: 'do_2', mimeType: 'application/pdf' }));

    const { result } = renderHook(() => useContentWithEnrichments('do_2'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockListForTypes).not.toHaveBeenCalled();
    expect(result.current.content).toMatchObject({ identifier: 'do_2' });
  });

  it('stays loading until BOTH the read and the list have settled, and never exposes the unmerged video content before that', async () => {
    mockContentRead.mockResolvedValue(readResponse({ identifier: 'do_1', mimeType: 'video/mp4' }));
    let resolveList: (v: unknown[]) => void = () => {};
    mockListForTypes.mockReturnValue(new Promise((resolve) => { resolveList = resolve; }));

    const { result } = renderHook(() => useContentWithEnrichments('do_1'), { wrapper: Wrapper });
    await waitFor(() => expect(mockListForTypes).toHaveBeenCalled());
    expect(result.current.isLoading).toBe(true);

    resolveList([liveTranscript]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.content).toHaveProperty('transcripts');
  });

  it('returns the plain content and no error when the list call fails (negative)', async () => {
    mockContentRead.mockResolvedValue(readResponse({ identifier: 'do_1', mimeType: 'video/mp4' }));
    mockListForTypes.mockRejectedValue(new Error('list down'));

    const { result } = renderHook(() => useContentWithEnrichments('do_1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.content).toMatchObject({ identifier: 'do_1', mimeType: 'video/mp4' });
    expect(result.current.content).not.toHaveProperty('transcripts');
  });

  it('surfaces a content read error as the hook error (negative)', async () => {
    mockContentRead.mockRejectedValue(new Error('read failed'));

    const { result } = renderHook(() => useContentWithEnrichments('do_1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.content).toBeUndefined();
    expect(mockListForTypes).not.toHaveBeenCalled();
  });

  it('keeps the same content object identity across re-renders', async () => {
    mockContentRead.mockResolvedValue(readResponse({ identifier: 'do_1', mimeType: 'video/mp4' }));
    mockListForTypes.mockResolvedValue([liveTranscript]);

    const { result, rerender } = renderHook(() => useContentWithEnrichments('do_1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const first = result.current.content;
    rerender();
    rerender();
    expect(result.current.content).toBe(first);
  });

  it('adds no transcripts when none is Live', async () => {
    mockContentRead.mockResolvedValue(readResponse({ identifier: 'do_1', mimeType: 'video/mp4' }));
    mockListForTypes.mockResolvedValue([{ ...liveTranscript, status: 'Processing' }]);

    const { result } = renderHook(() => useContentWithEnrichments('do_1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.content).not.toHaveProperty('transcripts');
  });

  it('passes mode: edit through to the content read', async () => {
    mockContentRead.mockResolvedValue(readResponse({ identifier: 'do_1', mimeType: 'application/pdf' }));

    const { result } = renderHook(() => useContentWithEnrichments('do_1', { mode: 'edit' }), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockContentRead).toHaveBeenCalledWith('do_1', undefined, 'edit');
  });

  it('does nothing while disabled or without a content id (negative)', async () => {
    const { result } = renderHook(() => useContentWithEnrichments('', { enabled: true }), { wrapper: Wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(mockContentRead).not.toHaveBeenCalled();
    expect(mockListForTypes).not.toHaveBeenCalled();
  });
});
