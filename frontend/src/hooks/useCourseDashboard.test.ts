import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCertUserSearch, useReissueCert } from './useCourseDashboard';

// ── Hoisted mocks ────────────────────────────────────────────────────────────
const {
  mockGetUserId,
  mockGetAuthInfo,
  mockSearchUserByUserName,
  mockGetPrivateUserEnrollments,
  mockReissueCertificate,
} = vi.hoisted(() => ({
  mockGetUserId: vi.fn<[], string | null>(),
  mockGetAuthInfo: vi.fn(),
  mockSearchUserByUserName: vi.fn(),
  mockGetPrivateUserEnrollments: vi.fn(),
  mockReissueCertificate: vi.fn(),
}));

vi.mock('../services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getUserId: mockGetUserId,
    getAuthInfo: mockGetAuthInfo,
  },
}));

vi.mock('../services/UserService', () => ({
  userService: {
    searchUserByUserName: mockSearchUserByUserName,
    getPrivateUserEnrollments: mockGetPrivateUserEnrollments,
  },
}));

vi.mock('../services/CertificateService', () => ({
  certificateService: {
    reissueCertificate: mockReissueCertificate,
  },
}));

// ── Test helpers ─────────────────────────────────────────────────────────────
const createWrapper = (client: QueryClient) =>
  ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);

function makeClient() {
  return new QueryClient({ defaultOptions: { mutations: { retry: false } } });
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('useReissueCert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReissueCertificate.mockResolvedValue({ data: {}, status: 200, headers: {} });
  });

  describe('resolveCreatedBy fallback (lines 12–16)', () => {
    it('uses getAuthInfo uid when getUserId returns null (lines 13–14)', async () => {
      mockGetUserId.mockReturnValue(null);
      mockGetAuthInfo.mockResolvedValue({ uid: 'auth-uid-123' });

      const client = makeClient();
      const { result } = renderHook(() => useReissueCert(), {
        wrapper: createWrapper(client),
      });

      await act(async () => {
        await result.current.mutateAsync({
          courseId: 'course-1',
          batchId: 'batch-1',
          userIds: ['user-1'],
        });
      });

      expect(mockGetAuthInfo).toHaveBeenCalled();
      expect(mockReissueCertificate).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 'auth-uid-123' })
      );
    });

    it('throws when both getUserId and getAuthInfo return null (line 16)', async () => {
      mockGetUserId.mockReturnValue(null);
      mockGetAuthInfo.mockResolvedValue({ uid: null });

      const client = makeClient();
      const { result } = renderHook(() => useReissueCert(), {
        wrapper: createWrapper(client),
      });

      act(() => {
        result.current.mutateAsync({
          courseId: 'course-1',
          batchId: 'batch-1',
          userIds: ['user-1'],
        }).catch(() => undefined);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
      expect(result.current.error?.message).toBe('User is not authenticated');
    });

    it('uses getUserId directly when it returns a value', async () => {
      mockGetUserId.mockReturnValue('direct-user-id');

      const client = makeClient();
      const { result } = renderHook(() => useReissueCert(), {
        wrapper: createWrapper(client),
      });

      await act(async () => {
        await result.current.mutateAsync({
          courseId: 'course-1',
          batchId: 'batch-1',
          userIds: ['user-1'],
        });
      });

      expect(mockGetAuthInfo).not.toHaveBeenCalled();
      expect(mockReissueCertificate).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 'direct-user-id' })
      );
    });
  });
});

describe('useCertUserSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserId.mockReturnValue('user-123');
    mockSearchUserByUserName.mockResolvedValue({
      data: {
        response: {
          content: [{ id: 'internal-user-id', userName: 'testuser' }],
        },
      },
    });
  });

  it('maps issuedCertificates from certificates field when issuedCertificates is empty (lines 68–69)', async () => {
    const certEntry = { id: 'cert-1', name: 'Course Certificate', identifier: 'cert-id-1' };
    mockGetPrivateUserEnrollments.mockResolvedValue({
      data: {
        courses: [
          {
            courseId: 'course-1',
            batchId: 'batch-1',
            courseName: 'Test Course',
            completionPercentage: 100,
            status: 2,
            // No issuedCertificates — uses certificates fallback
            issuedCertificates: [],
            certificates: [certEntry],
            batch: { batchId: 'batch-1', name: 'Batch 1', createdBy: 'admin' },
          },
        ],
      },
    });

    const client = makeClient();
    const { result } = renderHook(() => useCertUserSearch(), {
      wrapper: createWrapper(client),
    });

    let response: any;
    await act(async () => {
      response = await result.current.mutateAsync({
        userName: 'testuser',
        courseId: 'course-1',
      });
    });

    const batch = response.data.response.courses.batches[0];
    expect(batch!.issuedCertificates).toEqual([certEntry]);
  });

  it('uses issuedCertificates when present (skips certificates fallback)', async () => {
    const issuedCert = { id: 'cert-issued-1', name: 'Issued Cert', identifier: 'cert-id-issued' };
    mockGetPrivateUserEnrollments.mockResolvedValue({
      data: {
        courses: [
          {
            courseId: 'course-1',
            batchId: 'batch-1',
            courseName: 'Test Course',
            completionPercentage: 100,
            status: 2,
            issuedCertificates: [issuedCert],
            certificates: [{ id: 'should-not-use' }],
          },
        ],
      },
    });

    const client = makeClient();
    const { result } = renderHook(() => useCertUserSearch(), {
      wrapper: createWrapper(client),
    });

    let response: any;
    await act(async () => {
      response = await result.current.mutateAsync({
        userName: 'testuser',
        courseId: 'course-1',
      });
    });

    const batch = response.data.response.courses.batches[0];
    expect(batch!.issuedCertificates).toEqual([issuedCert]);
  });

  it('throws User not found when search returns no content', async () => {
    mockSearchUserByUserName.mockResolvedValue({
      data: { response: { content: [] } },
    });

    const client = makeClient();
    const { result } = renderHook(() => useCertUserSearch(), {
      wrapper: createWrapper(client),
    });

    act(() => {
      result.current.mutateAsync({
        userName: 'nonexistent',
        courseId: 'course-1',
      }).catch(() => undefined);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error?.message).toBe('User not found');
  });
});
