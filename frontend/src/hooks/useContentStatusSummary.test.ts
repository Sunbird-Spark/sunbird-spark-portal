import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useContentStatusSummary } from './useContentStatusSummary';

// ── Service mocks ──────────────────────────────────────────────────────────────

const { mockObservabilityService, mockUserAuthInfoService } = vi.hoisted(() => ({
  mockObservabilityService: {
    getContentStatusSummary: vi.fn(),
  },
  mockUserAuthInfoService: {
    isUserAuthenticated: vi.fn().mockReturnValue(true),
    getUserId: vi.fn().mockReturnValue('user-123'),
    getAuthInfo: vi.fn().mockResolvedValue({ isAuthenticated: true, uid: 'user-123', sid: 'session-abc' }),
  },
}));

vi.mock('@/services/reports/ObservabilityService', () => ({
  observabilityService: mockObservabilityService,
}));

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: mockUserAuthInfoService,
}));

vi.mock('@/services/UserService', () => ({
  UserService: vi.fn(function () {
    return {
      userRead: vi.fn().mockResolvedValue({
        data: {
          response: {
            rootOrgId: 'org-001',
            firstName: 'Test',
            lastName: 'Admin',
          },
        },
      }),
    };
  }),
}));

// ── Test wrapper ───────────────────────────────────────────────────────────────

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

// ── Fixtures ───────────────────────────────────────────────────────────────────

const SUMMARY_RESPONSE = {
  data: [
    {
      facet: 'status',
      values: [
        { status: 'live', count: 10 },
        { status: 'draft', count: 5 },
      ],
    },
    {
      facet: 'createdBy',
      values: [
        { createdBy: 'u1', count: 8, userDetails: { firstName: 'Alice', lastName: 'Smith' } },
        { createdBy: 'u2', count: 6, userDetails: { firstName: 'Bob' } },
        { createdBy: 'u3', count: 4, userDetails: { firstName: 'Carol', lastName: 'Jones' } },
        { createdBy: 'u4', count: 3, userDetails: { firstName: 'Dave' } },
        { createdBy: 'u5', count: 2, userDetails: { firstName: 'Eve', lastName: 'Taylor' } },
        { createdBy: 'u6', count: 1, userDetails: { firstName: 'Frank' } },
        { createdBy: 'u7', count: 0 }, // no userDetails — should be filtered out
      ],
    },
    {
      facet: 'primaryCategory',
      values: [
        { primaryCategory: 'course', count: 7 },
        { primaryCategory: 'resource', count: 3 },
      ],
    },
  ],
  count: 3,
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useContentStatusSummary', () => {
  beforeEach(() => {
    mockObservabilityService.getContentStatusSummary.mockResolvedValue(SUMMARY_RESPONSE);
  });

  it('returns statusData with capitalized status labels', async () => {
    const { result } = renderHook(() => useContentStatusSummary(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.statusData).toEqual([
      { status: 'Live', count: 10 },
      { status: 'Draft', count: 5 },
    ]);
  });

  it('returns top 5 creators sorted by count descending', async () => {
    const { result } = renderHook(() => useContentStatusSummary(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.topCreatorsData).toHaveLength(5);
    expect(result.current.topCreatorsData[0]!.name).toBe('Alice Smith');
    expect(result.current.topCreatorsData[0]!.count).toBe(8);
  });

  it('filters out creators without userDetails', async () => {
    const { result } = renderHook(() => useContentStatusSummary(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const names = result.current.topCreatorsData.map((c) => c.name);
    expect(names).not.toContain('');
    expect(result.current.topCreatorsData.every((c) => c.name.length > 0)).toBe(true);
  });

  it('trims lastName when absent from creator name', async () => {
    const { result } = renderHook(() => useContentStatusSummary(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const bob = result.current.topCreatorsData.find((c) => c.name === 'Bob');
    expect(bob).toBeDefined();
  });

  it('returns categoryData with capitalized group labels', async () => {
    const { result } = renderHook(() => useContentStatusSummary(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.categoryData).toEqual([
      { group: 'Course', count: 7 },
      { group: 'Resource', count: 3 },
    ]);
  });

  it('returns empty arrays when facets are absent', async () => {
    mockObservabilityService.getContentStatusSummary.mockResolvedValue({ data: [], count: 0 });

    const { result } = renderHook(() => useContentStatusSummary(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.statusData).toEqual([]);
    expect(result.current.topCreatorsData).toEqual([]);
    expect(result.current.categoryData).toEqual([]);
  });

  it('returns isError true when API fails', async () => {
    mockObservabilityService.getContentStatusSummary.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useContentStatusSummary(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(true);
  });

  it('calls getContentStatusSummary with the user rootOrgId', async () => {
    const { result } = renderHook(() => useContentStatusSummary(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockObservabilityService.getContentStatusSummary).toHaveBeenCalledWith('org-001');
  });
});
