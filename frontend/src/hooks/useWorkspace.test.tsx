import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWorkspace } from './useWorkspace';
import { init, IHttpClient } from '../lib/http-client';
import { WORKSPACE_STATUS_FILTER } from '../pages/workspace/workspaceConstants';

let mockClient: IHttpClient;

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

type SearchBody = { request: { limit?: number; filters: Record<string, unknown> } };

const searchCalls = () => (mockClient.post as unknown as { mock: { calls: [string, SearchBody][] } }).mock.calls;
const contentSearchBody = () => searchCalls().find((call) => call[1]?.request?.limit !== 1)![1];
const countsBody = () => searchCalls().find((call) => call[1]?.request?.limit === 1)![1];

const renderWorkspace = async (options: Partial<Parameters<typeof useWorkspace>[0]> = {}) => {
  renderHook(
    () => useWorkspace({ userId: 'user_1', activeTab: 'all', sortBy: 'updated', typeFilter: 'all', ...options }),
    { wrapper: Wrapper },
  );
  await waitFor(() => expect(mockClient.post).toHaveBeenCalled());
  await waitFor(() => expect(searchCalls().length).toBeGreaterThanOrEqual(2));
};

describe('useWorkspace - enrichmentFilter', () => {
  beforeEach(() => {
    queryClient.clear();
    mockClient = {
      get: vi.fn(),
      post: vi.fn().mockResolvedValue({ data: { content: [], count: 0 }, status: 200, headers: {} }),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      updateHeaders: vi.fn(),
    };
    init(mockClient);
  });

  it('adds enrichmentTypes to the content search filters when an enrichment filter is set', async () => {
    await renderWorkspace({ enrichmentFilter: ['Transcript'] });
    expect(contentSearchBody().request.filters.enrichmentTypes).toEqual(['Transcript']);
  });

  it('adds enrichmentTypes to the counts request too, so tab badges match the filtered list', async () => {
    await renderWorkspace({ enrichmentFilter: ['Transcript'] });
    expect(countsBody().request.filters.enrichmentTypes).toEqual(['Transcript']);
  });

  it('omits enrichmentTypes from both requests when the filter is empty or not given (negative)', async () => {
    await renderWorkspace({ enrichmentFilter: [] });
    expect(contentSearchBody().request.filters).not.toHaveProperty('enrichmentTypes');
    expect(countsBody().request.filters).not.toHaveProperty('enrichmentTypes');
  });

  it('never sends the removed exists field (negative)', async () => {
    await renderWorkspace({ enrichmentFilter: ['Transcript'] });
    expect(contentSearchBody().request).not.toHaveProperty('exists');
    expect(countsBody().request).not.toHaveProperty('exists');
  });

  it('refetches with the new filter when enrichmentFilter changes', async () => {
    const { rerender } = renderHook(
      ({ filter }: { filter: string[] }) =>
        useWorkspace({ userId: 'user_1', activeTab: 'all', sortBy: 'updated', typeFilter: 'all', enrichmentFilter: filter }),
      { wrapper: Wrapper, initialProps: { filter: [] as string[] } },
    );
    await waitFor(() => expect(searchCalls().length).toBeGreaterThanOrEqual(2));
    const before = searchCalls().length;
    rerender({ filter: ['Transcript'] });
    await waitFor(() => expect(searchCalls().length).toBeGreaterThan(before));
    const last = searchCalls().filter((call) => call[1]?.request?.limit !== 1).pop()![1];
    expect(last.request.filters.enrichmentTypes).toEqual(['Transcript']);
  });

  it('does not touch status filtering at all - the filter leaves whatever the tab already narrowed to', async () => {
    await renderWorkspace({ enrichmentFilter: ['Transcript'] });
    // "all" tab's own status filter is already the full allow-list - unaffected by the filter either way.
    expect(contentSearchBody().request.filters).toEqual({
      createdBy: 'user_1',
      primaryCategory: expect.any(Array),
      status: [...WORKSPACE_STATUS_FILTER],
      enrichmentTypes: ['Transcript'],
    });
  });

  it('preserves a narrower tab\'s own status filter when the filter is set (regression: previously widened to every status, breaking Drafts/Review/Published)', async () => {
    await renderWorkspace({ activeTab: 'drafts', enrichmentFilter: ['Transcript'] });
    expect(contentSearchBody().request.filters.status).toEqual(['Draft', 'FlagDraft']);
  });

  it('combines with the "uploads" secondary view: Draft-only status and mimeType narrowing are untouched', async () => {
    await renderWorkspace({ secondaryView: 'uploads', enrichmentFilter: ['Transcript'] });
    const { filters } = contentSearchBody().request;
    expect(filters.status).toEqual(['Draft']);
    expect(filters.mimeType).toEqual(expect.any(Array));
    expect(filters.enrichmentTypes).toEqual(['Transcript']);
  });

  it('combines with the "collaborations" secondary view without dropping collaborators scoping', async () => {
    await renderWorkspace({ secondaryView: 'collaborations', enrichmentFilter: ['Transcript'] });
    const { filters } = contentSearchBody().request;
    expect(filters.collaborators).toEqual(['user_1']);
    expect(filters.enrichmentTypes).toEqual(['Transcript']);
  });

  it('does not widen the reviewer pending-review queue\'s status/createdBy scoping when the filter is set (regression: previously leaked other creators\' drafts into the review queue)', async () => {
    await renderWorkspace({ activeTab: 'pending-review', userRole: 'reviewer', enrichmentFilter: ['Transcript'] });
    const { filters } = contentSearchBody().request;
    expect(filters.status).toEqual(['Review', 'Processing', 'FlagReview']);
    expect(filters.createdBy).toEqual({ '!=': 'user_1' });
  });
});
