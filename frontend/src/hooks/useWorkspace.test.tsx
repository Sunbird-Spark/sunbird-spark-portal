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

describe('useWorkspace - transcriptFilter', () => {
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

  it('includes exists: ["enrichment"] in the content search request when transcriptFilter is true', async () => {
    renderHook(
      () =>
        useWorkspace({
          userId: 'user_1',
          activeTab: 'all',
          sortBy: 'updated',
          typeFilter: 'all',
          transcriptFilter: true,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(mockClient.post).toHaveBeenCalled());
    const contentSearchCall = (mockClient.post as any).mock.calls.find(
      (call: [string, { request: { limit?: number } }]) => call[1]?.request?.limit !== 1,
    );
    expect(contentSearchCall[1].request.exists).toEqual(['enrichment']);
  });

  it('does not touch status filtering at all - exists ANDs with whatever the tab already narrowed to', async () => {
    renderHook(
      () =>
        useWorkspace({
          userId: 'user_1',
          activeTab: 'all',
          sortBy: 'updated',
          typeFilter: 'all',
          transcriptFilter: true,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(mockClient.post).toHaveBeenCalled());
    const contentSearchCall = (mockClient.post as any).mock.calls.find(
      (call: [string, { request: { limit?: number } }]) => call[1]?.request?.limit !== 1,
    );
    // "all" tab's own status filter is already the full allow-list - unaffected by transcriptFilter either way.
    expect(contentSearchCall[1].request.filters).toEqual({
      createdBy: 'user_1',
      primaryCategory: expect.any(Array),
      status: [...WORKSPACE_STATUS_FILTER],
    });
  });

  it('preserves a narrower tab\'s own status filter when transcriptFilter is true (regression: previously widened to every status, breaking Drafts/Review/Published)', async () => {
    renderHook(
      () =>
        useWorkspace({
          userId: 'user_1',
          activeTab: 'drafts',
          sortBy: 'updated',
          typeFilter: 'all',
          transcriptFilter: true,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(mockClient.post).toHaveBeenCalled());
    const contentSearchCall = (mockClient.post as any).mock.calls.find(
      (call: [string, { request: { limit?: number } }]) => call[1]?.request?.limit !== 1,
    );
    expect(contentSearchCall[1].request.filters.status).toEqual(['Draft', 'FlagDraft']);
    expect(contentSearchCall[1].request.exists).toEqual(['enrichment']);
  });

  it('preserves the "uploads" secondary view\'s Draft-only status when transcriptFilter is also true (regression: previously widened to every status)', async () => {
    renderHook(
      () =>
        useWorkspace({
          userId: 'user_1',
          activeTab: 'all',
          sortBy: 'updated',
          typeFilter: 'all',
          secondaryView: 'uploads',
          transcriptFilter: true,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(mockClient.post).toHaveBeenCalled());
    const contentSearchCall = (mockClient.post as any).mock.calls.find(
      (call: [string, { request: { limit?: number } }]) => call[1]?.request?.limit !== 1,
    );
    expect(contentSearchCall[1].request.filters.status).toEqual(['Draft']);
    // mimeType narrowing from the "uploads" view is untouched by the transcript filter.
    expect(contentSearchCall[1].request.filters.mimeType).toEqual(expect.any(Array));
  });

  it('does not widen the reviewer pending-review queue\'s status/createdBy scoping when transcriptFilter is true (regression: previously leaked other creators\' drafts into the review queue)', async () => {
    renderHook(
      () =>
        useWorkspace({
          userId: 'user_1',
          activeTab: 'pending-review',
          sortBy: 'updated',
          typeFilter: 'all',
          userRole: 'reviewer',
          transcriptFilter: true,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(mockClient.post).toHaveBeenCalled());
    const contentSearchCall = (mockClient.post as any).mock.calls.find(
      (call: [string, { request: { limit?: number } }]) => call[1]?.request?.limit !== 1,
    );
    expect(contentSearchCall[1].request.filters.status).toEqual(['Review', 'Processing', 'FlagReview']);
    expect(contentSearchCall[1].request.filters.createdBy).toEqual({ '!=': 'user_1' });
  });

  it('also includes exists: ["enrichment"] in the counts request, so tab badges stay consistent with the filtered list', async () => {
    renderHook(
      () =>
        useWorkspace({
          userId: 'user_1',
          activeTab: 'all',
          sortBy: 'updated',
          typeFilter: 'all',
          transcriptFilter: true,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(mockClient.post).toHaveBeenCalled());
    const countsCall = (mockClient.post as any).mock.calls.find(
      (call: [string, { request: { limit?: number } }]) => call[1]?.request?.limit === 1,
    );
    expect(countsCall[1].request.exists).toEqual(['enrichment']);
  });

  it('omits exists from the counts request when transcriptFilter is false (negative)', async () => {
    renderHook(
      () =>
        useWorkspace({
          userId: 'user_1',
          activeTab: 'all',
          sortBy: 'updated',
          typeFilter: 'all',
          transcriptFilter: false,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(mockClient.post).toHaveBeenCalled());
    const countsCall = (mockClient.post as any).mock.calls.find(
      (call: [string, { request: { limit?: number } }]) => call[1]?.request?.limit === 1,
    );
    expect(countsCall[1].request.exists).toBeUndefined();
  });

  it('omits exists from the content search request when transcriptFilter is false (negative)', async () => {
    renderHook(
      () =>
        useWorkspace({
          userId: 'user_1',
          activeTab: 'all',
          sortBy: 'updated',
          typeFilter: 'all',
          transcriptFilter: false,
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(mockClient.post).toHaveBeenCalled());
    const contentSearchCall = (mockClient.post as any).mock.calls.find(
      (call: [string, { request: { limit?: number } }]) => call[1]?.request?.limit !== 1,
    );
    expect(contentSearchCall[1].request.exists).toBeUndefined();
  });
});
