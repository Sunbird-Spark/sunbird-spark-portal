import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { useCertUserSearch, useReissueCert } from './useCourseDashboard';
import { certificateService } from '../services/CertificateService';
import { userService } from '../services/UserService';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

// Mock dependencies
vi.mock('../services/CertificateService', () => ({
  certificateService: {
    reissueCertificate: vi.fn(),
  },
}));

vi.mock('../services/UserService', () => ({
  userService: {
    searchUserByUserName: vi.fn(),
    getUserEnrollments: vi.fn(),
    getPrivateUserEnrollments: vi.fn(),
  },
}));

vi.mock('../services/userAuthInfoService/userAuthInfoService', () => ({
  __esModule: true,
  default: {
    getUserId: vi.fn(),
    getAuthInfo: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const QueryProviderWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useCourseDashboard hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('useCertUserSearch', () => {
    it('calls searchUserByUserName and getUserEnrollments to assemble response', async () => {
      // Mock /user/v3/search response (AxiosAdapter strips 'result')
      const mockSearchRes = { data: { response: { content: [{ id: 'u1', userName: 'User 1' }] } } };
      (userService.searchUserByUserName as import('vitest').Mock).mockResolvedValue(mockSearchRes);

      // Mock /course/v1/user/enrollment/list/:userId response (AxiosAdapter strips 'result')
      const mockEnrollmentRes = {
        data: {
          courses: [
              {
                courseId: 'course-1',
                courseName: 'Test Course',
                batchId: 'b1',
                completionPercentage: 100,
                status: 2,
                batch: { name: 'Batch 1', createdBy: 'u1' },
                issuedCertificates: [{ name: 'Test Cert' }]
              },
              { courseId: 'other-course' } // Should be filtered out
            ]
        }
      };
      (userService.getPrivateUserEnrollments as import('vitest').Mock).mockResolvedValue(mockEnrollmentRes);

      const { result } = renderHook(() => useCertUserSearch(), { wrapper: QueryProviderWrapper });

      result.current.mutate({ userName: 'User1', courseId: 'course-1' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(userService.searchUserByUserName).toHaveBeenCalledWith('User1');
      expect(userService.getPrivateUserEnrollments).toHaveBeenCalledWith('u1');

      // Assert the assembled response structure
      expect(result.current.data?.data?.response?.courses?.batches).toHaveLength(1);
      expect(result.current.data?.data?.response?.courses?.batches?.[0]?.batchId).toBe('b1');
    });

    it('throws error if user is not found', async () => {
      (userService.searchUserByUserName as import('vitest').Mock).mockResolvedValue({ data: { response: { content: [] } } });

      const { result } = renderHook(() => useCertUserSearch(), { wrapper: QueryProviderWrapper });

      result.current.mutate({ userName: 'UnknownUser', courseId: 'course-1' });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('User not found');
    });
  });

  describe('useReissueCert', () => {
    it('calls reissueCertificate with resolving createdBy', async () => {
      (userAuthInfoService.getUserId as import('vitest').Mock).mockReturnValue('user-123');
      const mockResult = { data: 'ok' };
      (certificateService.reissueCertificate as import('vitest').Mock).mockResolvedValue(mockResult);

      const { result } = renderHook(() => useReissueCert(), { wrapper: QueryProviderWrapper });

      result.current.mutate({ courseId: 'course-1', batchId: 'batch-1', userIds: ['u1', 'u2'] });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(certificateService.reissueCertificate).toHaveBeenCalledWith({
        courseId: 'course-1',
        batchId: 'batch-1',
        userIds: ['u1', 'u2'],
        createdBy: 'user-123',
      });
    });
  });
});
