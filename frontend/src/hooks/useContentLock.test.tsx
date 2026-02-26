import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { useContentLock } from './useContentLock';

const mockCreateLock = vi.fn();

vi.mock('../services/LockService', () => ({
  lockService: {
    createLock: (...args: any[]) => mockCreateLock(...args),
  },
}));

const mockGetUserId = vi.fn();

vi.mock('../services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getUserId: (...args: any[]) => mockGetUserId(...args),
  },
}));

const mockUserReadData = { data: null as any };

vi.mock('./useUserRead', () => ({
  useUserRead: () => ({ data: mockUserReadData.data }),
}));

const createWrapper = (initialEntries = ['/editor/do_123']) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

const baseMetadata = {
  identifier: 'do_123',
  contentType: 'Course',
  mimeType: 'application/vnd.ekstep.content-collection',
};

describe('useContentLock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserId.mockReturnValue('user-1');
    mockUserReadData.data = {
      data: {
        response: { firstName: 'Content', lastName: 'Creator' },
      },
    };
  });

  it('should acquire lock and set lockKey on success', async () => {
    mockCreateLock.mockResolvedValue({
      data: {
        lockKey: 'lock-abc',
        expiresAt: '2026-02-20T11:00:00.000Z',
        expiresIn: 2,
      },
      status: 200,
      headers: {},
    });

    const { result } = renderHook(
      () =>
        useContentLock({
          resourceId: 'do_123',
          resourceType: 'Content',
          metadata: baseMetadata,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLocking).toBe(false));

    expect(result.current.lockKey).toBe('lock-abc');
    expect(result.current.lockError).toBeNull();
    expect(mockCreateLock).toHaveBeenCalledWith({
      resourceId: 'do_123',
      resourceType: 'Content',
      resourceInfo: JSON.stringify({
        contentType: 'Course',
        identifier: 'do_123',
        mimeType: 'application/vnd.ekstep.content-collection',
      }),
      creatorInfo: JSON.stringify({ name: 'Content Creator', id: 'user-1' }),
      createdBy: 'user-1',
      isRootOrgAdmin: false,
    });
  });

  it('should not acquire lock when enabled is false', async () => {
    const { result } = renderHook(
      () =>
        useContentLock({
          resourceId: 'do_123',
          resourceType: 'Content',
          metadata: baseMetadata,
          enabled: false,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLocking).toBe(false));

    expect(mockCreateLock).not.toHaveBeenCalled();
    expect(result.current.lockKey).toBeNull();
  });

  it('should not acquire lock when resourceId is undefined', async () => {
    const { result } = renderHook(
      () =>
        useContentLock({
          resourceId: undefined,
          resourceType: 'Content',
          metadata: baseMetadata,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLocking).toBe(false));
    expect(mockCreateLock).not.toHaveBeenCalled();
  });

  it('should not acquire lock when metadata is null', async () => {
    const { result } = renderHook(
      () =>
        useContentLock({
          resourceId: 'do_123',
          resourceType: 'Content',
          metadata: null,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLocking).toBe(false));
    expect(mockCreateLock).not.toHaveBeenCalled();
  });

  it('should set lockError when user is not authenticated', async () => {
    mockGetUserId.mockReturnValue(null);

    const { result } = renderHook(
      () =>
        useContentLock({
          resourceId: 'do_123',
          resourceType: 'Content',
          metadata: baseMetadata,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.lockError).toBe('User not authenticated.'));
    expect(mockCreateLock).not.toHaveBeenCalled();
  });

  it('should handle RESOURCE_LOCKED error', async () => {
    mockCreateLock.mockRejectedValue({
      response: {
        data: {
          params: {
            err: 'RESOURCE_LOCKED',
            errmsg: 'resource is locked by another user',
          },
        },
      },
    });

    const { result } = renderHook(
      () =>
        useContentLock({
          resourceId: 'do_123',
          resourceType: 'Content',
          metadata: baseMetadata,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLocking).toBe(false));
    expect(result.current.lockError).toBe('content is locked by another user');
    expect(result.current.lockKey).toBeNull();
  });

  it('should handle RESOURCE_SELF_LOCKED error', async () => {
    mockCreateLock.mockRejectedValue({
      response: {
        data: {
          params: {
            err: 'RESOURCE_SELF_LOCKED',
            errmsg: 'resource is already locked by you',
          },
        },
      },
    });

    const { result } = renderHook(
      () =>
        useContentLock({
          resourceId: 'do_123',
          resourceType: 'Content',
          metadata: baseMetadata,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLocking).toBe(false));
    expect(result.current.lockError).toBe('content is already locked by you');
  });

  it('should handle generic API errors', async () => {
    mockCreateLock.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () =>
        useContentLock({
          resourceId: 'do_123',
          resourceType: 'Content',
          metadata: baseMetadata,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLocking).toBe(false));
    expect(result.current.lockError).toBe('Failed to acquire content lock.');
  });

  it('should skip lock acquisition if lockKey already in query params', async () => {
    const { result } = renderHook(
      () =>
        useContentLock({
          resourceId: 'do_123',
          resourceType: 'Content',
          metadata: baseMetadata,
        }),
      { wrapper: createWrapper(['/editor/do_123?lockKey=existing-key']) },
    );

    await waitFor(() => expect(result.current.isLocking).toBe(false));
    expect(result.current.lockKey).toBe('existing-key');
    expect(mockCreateLock).not.toHaveBeenCalled();
  });

  it('should use primaryCategory when contentType is missing', async () => {
    const metadata = {
      identifier: 'do_123',
      primaryCategory: 'Practice Question Set',
      mimeType: 'application/vnd.sunbird.questionset',
    };

    mockCreateLock.mockResolvedValue({
      data: { lockKey: 'lock-xyz', expiresAt: '', expiresIn: 2 },
      status: 200,
      headers: {},
    });

    renderHook(
      () =>
        useContentLock({
          resourceId: 'do_123',
          resourceType: 'Content',
          metadata,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(mockCreateLock).toHaveBeenCalled());

    const call = mockCreateLock.mock.calls[0]?.[0];
    expect(call).toBeDefined();
    const resourceInfo = JSON.parse(call!.resourceInfo);
    expect(resourceInfo.contentType).toBe('Practice Question Set');
  });
});
