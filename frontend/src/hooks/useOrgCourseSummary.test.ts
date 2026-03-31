import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrgCourseSummary } from './useOrgCourseSummary';

// ── Service mocks ──────────────────────────────────────────────────────────────

const { mockContentService, mockObservabilityService, mockUserAuthInfoService } = vi.hoisted(() => ({
  mockContentService: {
    contentSearch: vi.fn(),
  },
  mockObservabilityService: {
    getOrgCourseEnrolmentSummary: vi.fn(),
  },
  mockUserAuthInfoService: {
    isUserAuthenticated: vi.fn().mockReturnValue(true),
    getUserId: vi.fn().mockReturnValue('user-123'),
    getAuthInfo: vi.fn().mockResolvedValue({ isAuthenticated: true, uid: 'user-123', sid: 'session-abc' }),
  },
}));

vi.mock('@/services/ContentService', () => ({
  ContentService: vi.fn(function () { return mockContentService; }),
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

const SEARCH_RESPONSE = {
  data: {
    content: [
      { identifier: 'do_1', name: 'AI Course' },
      { identifier: 'do_2', name: 'ML Course' },
    ],
    count: 2,
  },
};

const SUMMARY_RESPONSE = {
  data: [
    {
      courseid: 'do_1',
      collectionDetails: { name: 'AI Course', identifier: 'do_1', contentType: 'Course' },
      total_enrolled: 10,
      total_completed: 7,
      certificates_issued: 5,
    },
    {
      courseid: 'do_2',
      collectionDetails: { name: 'ML Course', identifier: 'do_2', contentType: 'Course' },
      total_enrolled: 8,
      total_completed: 0,
      certificates_issued: 0,
    },
  ],
  count: 2,
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useOrgCourseSummary', () => {
  beforeEach(() => {
    mockContentService.contentSearch.mockResolvedValue(SEARCH_RESPONSE);
    mockObservabilityService.getOrgCourseEnrolmentSummary.mockResolvedValue(SUMMARY_RESPONSE);
  });

  it('returns mapped AdminCourseSummary array on success', async () => {
    const { result } = renderHook(() => useOrgCourseSummary(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0]).toMatchObject({
      id: 'do_1',
      courseName: 'AI Course',
      totalEnrolled: 10,
      totalCompleted: 7,
      completionPercent: 70,
      certificatesIssued: 5,
    });
  });

  it('calculates 0 completionPercent when totalEnrolled is 0', async () => {
    mockObservabilityService.getOrgCourseEnrolmentSummary.mockResolvedValue({
      data: [{ courseid: 'do_3', total_enrolled: 0, total_completed: 0, certificates_issued: 0 }],
      count: 1,
    });

    const { result } = renderHook(() => useOrgCourseSummary(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data[0]!.completionPercent).toBe(0);
  });

  it('falls back to courseid as courseName when collectionDetails is missing', async () => {
    mockObservabilityService.getOrgCourseEnrolmentSummary.mockResolvedValue({
      data: [{ courseid: 'do_4', total_enrolled: 5, total_completed: 2, certificates_issued: 1 }],
      count: 1,
    });

    const { result } = renderHook(() => useOrgCourseSummary(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data[0]!.courseName).toBe('do_4');
  });

  it('passes course IDs from search results to the observability API', async () => {
    const { result } = renderHook(() => useOrgCourseSummary(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockObservabilityService.getOrgCourseEnrolmentSummary).toHaveBeenCalledWith(
      expect.arrayContaining(['do_1', 'do_2'])
    );
  });

  it('returns isError true when observability API fails', async () => {
    mockObservabilityService.getOrgCourseEnrolmentSummary.mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useOrgCourseSummary(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toEqual([]);
  });

  it('returns isError true when content search fails', async () => {
    mockContentService.contentSearch.mockRejectedValue(new Error('Search error'));

    const { result } = renderHook(() => useOrgCourseSummary(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(true);
  });
});
