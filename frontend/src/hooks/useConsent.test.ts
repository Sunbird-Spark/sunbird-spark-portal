import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConsent } from './useConsent';
import { consentService } from '../services/consent';
import { useUserId } from './useAuthInfo';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('../services/consent', () => ({
  consentService: {
    read: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('./useAuthInfo', () => ({
  useUserId: vi.fn(),
}));

describe('useConsent', () => {
  const mockQueryClient = {
    invalidateQueries: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQueryClient).mockReturnValue(mockQueryClient as unknown as ReturnType<typeof useQueryClient>);
    vi.mocked(useUserId).mockReturnValue('user-123');
    vi.mocked(useMutation).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof useMutation>);
  });

  it('disables query when userId is missing', () => {
    vi.mocked(useUserId).mockReturnValue(null);
    vi.mocked(useQuery).mockImplementation((opts) => opts as unknown as ReturnType<typeof useQuery>);
    renderHook(() => useConsent({ collectionId: 'col-1', channel: 'ch-1' }));
    expect(useQuery).toHaveBeenCalled();
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    expect(call.enabled).toBe(false);
  });

  it('disables query when collectionId or channel is missing', () => {
    vi.mocked(useQuery).mockImplementation((opts) => opts as unknown as ReturnType<typeof useQuery>);
    renderHook(() => useConsent({ collectionId: undefined, channel: 'ch-1' }));
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    expect(call.enabled).toBe(false);

    vi.clearAllMocks();
    vi.mocked(useMutation).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof useMutation>);
    renderHook(() => useConsent({ collectionId: 'col-1', channel: undefined }));
    const call2 = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    expect(call2.enabled).toBe(false);
  });

  it('sets queryKey with collectionId, channel, and userId', () => {
    vi.mocked(useQuery).mockImplementation((opts) => opts as unknown as ReturnType<typeof useQuery>);
    renderHook(() => useConsent({ collectionId: 'col-1', channel: 'ch-1' }));
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    expect(call.queryKey).toEqual(['consent', 'col-1', 'ch-1', 'user-123']);
  });

  it('returns status and lastUpdatedOn from query data', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { status: 'ACTIVE', lastUpdatedOn: '2026-02-26T10:00:00Z' },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetched: true,
    } as unknown as ReturnType<typeof useQuery>);
    vi.mocked(useMutation).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as unknown as ReturnType<typeof useMutation>);

    const { result } = renderHook(() => useConsent({ collectionId: 'col-1', channel: 'ch-1' }));

    expect(result.current.status).toBe('ACTIVE');
    expect(result.current.lastUpdatedOn).toBe('2026-02-26T10:00:00Z');
  });

  it('updateConsent calls consentService.update and invalidates queries on success', async () => {
    vi.mocked(useQuery).mockReturnValue({
      data: { status: null, lastUpdatedOn: undefined },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetched: true,
    } as unknown as ReturnType<typeof useQuery>);
    vi.mocked(useMutation).mockImplementation((opts) => {
      const mutationOpts = opts as { mutationFn: (s: 'ACTIVE' | 'REVOKED') => Promise<void>; onSuccess?: () => void };
      return {
        mutateAsync: async (status: 'ACTIVE' | 'REVOKED') => {
          await mutationOpts.mutationFn(status);
          mutationOpts.onSuccess?.();
        },
        isPending: false,
      } as unknown as ReturnType<typeof useMutation>;
    });
    vi.mocked(consentService.update).mockResolvedValue({} as never);

    const { result } = renderHook(() => useConsent({ collectionId: 'col-1', channel: 'ch-1' }));

    await result.current.updateConsent('ACTIVE');

    expect(consentService.update).toHaveBeenCalledWith({
      status: 'ACTIVE',
      userId: 'user-123',
      consumerId: 'ch-1',
      objectId: 'col-1',
      objectType: 'Collection',
    });
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['consent', 'col-1', 'ch-1', 'user-123'],
    });
  });

  it('updateConsent throws when consentService.update fails', async () => {
    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetched: false,
    } as unknown as ReturnType<typeof useQuery>);
    vi.mocked(useMutation).mockImplementation((opts) => ({
      mutateAsync: opts.mutationFn,
      isPending: false,
    } as unknown as ReturnType<typeof useMutation>));
    vi.mocked(consentService.update).mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useConsent({ collectionId: 'col-1', channel: 'ch-1' }));

    await expect(result.current.updateConsent('REVOKED')).rejects.toThrow('API error');
  });

  it('queryFn calls consentService.read and extracts status and lastUpdatedOn', async () => {
    vi.mocked(useQuery).mockImplementation((opts) => opts as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useConsent({ collectionId: 'col-1', channel: 'ch-1' }));

    vi.mocked(consentService.read).mockResolvedValue({
      data: {
        consents: [
          { status: 'ACTIVE' as const, lastUpdatedOn: '2026-01-01T00:00:00Z', userId: 'user-123', consumerId: 'ch-1', objectId: 'col-1' },
        ],
      },
    } as any);

    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    const data = await (call.queryFn as () => Promise<unknown>)();

    expect(consentService.read).toHaveBeenCalledWith({
      userId: 'user-123',
      consumerId: 'ch-1',
      objectId: 'col-1',
    });
    expect(data).toEqual({ status: 'ACTIVE', lastUpdatedOn: '2026-01-01T00:00:00Z' });
  });

  it('queryFn returns null status when consents array is empty', async () => {
    vi.mocked(useQuery).mockImplementation((opts) => opts as unknown as ReturnType<typeof useQuery>);

    renderHook(() => useConsent({ collectionId: 'col-1', channel: 'ch-1' }));

    vi.mocked(consentService.read).mockResolvedValue({ data: { consents: [] } } as any);

    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    const data = await (call.queryFn as () => Promise<unknown>)();

    expect(data).toEqual({ status: null, lastUpdatedOn: undefined });
  });

  it('queryFn returns early with null status when userId is missing', async () => {
    vi.mocked(useUserId).mockReturnValue(null);
    vi.mocked(useQuery).mockImplementation((opts) => opts as unknown as ReturnType<typeof useQuery>);

    renderHook(() => useConsent({ collectionId: 'col-1', channel: 'ch-1' }));

    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    const data = await (call.queryFn as () => Promise<unknown>)();

    expect(consentService.read).not.toHaveBeenCalled();
    expect(data).toEqual({ status: null, lastUpdatedOn: undefined });
  });

  it('updateConsent mutationFn skips update when userId is missing', async () => {
    vi.mocked(useUserId).mockReturnValue(null);
    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useQuery>);
    vi.mocked(useMutation).mockImplementation((opts) => ({
      mutateAsync: opts.mutationFn,
      isPending: false,
    } as unknown as ReturnType<typeof useMutation>));

    const { result } = renderHook(() => useConsent({ collectionId: 'col-1', channel: 'ch-1' }));
    await result.current.updateConsent('ACTIVE');
    expect(consentService.update).not.toHaveBeenCalled();
  });

  it('returns defaults when query data is null', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useConsent({ collectionId: 'col-1', channel: 'ch-1' }));
    expect(result.current.status).toBeNull();
    expect(result.current.lastUpdatedOn).toBeUndefined();
  });

  it('enabled is false when enabled option is false', () => {
    vi.mocked(useQuery).mockImplementation((opts) => opts as unknown as ReturnType<typeof useQuery>);
    renderHook(() => useConsent({ collectionId: 'col-1', channel: 'ch-1', enabled: false }));
    const call = vi.mocked(useQuery).mock.calls[0]?.[0] as Parameters<typeof useQuery>[0];
    expect(call.enabled).toBe(false);
  });

  it('returns null error when error is not an Error instance (line 76 false branch)', () => {
    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: 'string error',   // not an Error instance → should be mapped to null
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useConsent({ collectionId: 'col-1', channel: 'ch-1' }));
    expect(result.current.error).toBeNull();
  });

  it('returns Error instance when error is an Error (line 76 true branch)', () => {
    const err = new Error('test error');
    vi.mocked(useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: err,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useConsent({ collectionId: 'col-1', channel: 'ch-1' }));
    expect(result.current.error).toBe(err);
  });
});
