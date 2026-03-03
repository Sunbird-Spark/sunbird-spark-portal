import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUserId } from './useUser';
import userAuthInfoService from '../services/userAuthInfoService/userAuthInfoService';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('../services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getUserId: vi.fn(),
    getAuthInfo: vi.fn(),
  },
}));

vi.mock('../services/UserService', () => ({
  UserService: class {
    getUserRoles = vi.fn();
  },
}));

describe('useCurrentUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the correct query key and staleTime', () => {
    (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);

    const result = useCurrentUserId() as any;

    expect(useQuery).toHaveBeenCalled();
    expect(result.queryKey).toEqual(['currentUserId']);
    expect(result.staleTime).toBe(5 * 60 * 1000);
    expect(result.retry).toBe(1);
  });

  it('returns uid from cache when getUserId has a value', async () => {
    const cachedUid = 'cdee2eb6-d1d6-43bd-b18d-959213006510';
    (userAuthInfoService.getUserId as import('vitest').Mock).mockReturnValue(cachedUid);
    (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);

    const result = useCurrentUserId() as any;
    const uid = await result.queryFn();

    expect(userAuthInfoService.getUserId).toHaveBeenCalled();
    expect(userAuthInfoService.getAuthInfo).not.toHaveBeenCalled();
    expect(uid).toBe(cachedUid);
  });

  it('falls back to getAuthInfo when getUserId returns null', async () => {
    const fetchedUid = 'cdee2eb6-d1d6-43bd-b18d-959213006510';
    (userAuthInfoService.getUserId as import('vitest').Mock).mockReturnValue(null);
    (userAuthInfoService.getAuthInfo as import('vitest').Mock).mockResolvedValue({ uid: fetchedUid });
    (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);

    const result = useCurrentUserId() as any;
    const uid = await result.queryFn();

    expect(userAuthInfoService.getAuthInfo).toHaveBeenCalled();
    expect(uid).toBe(fetchedUid);
  });

  it('returns null when both getUserId and getAuthInfo return no uid', async () => {
    (userAuthInfoService.getUserId as import('vitest').Mock).mockReturnValue(null);
    (userAuthInfoService.getAuthInfo as import('vitest').Mock).mockResolvedValue({ uid: null });
    (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);

    const result = useCurrentUserId() as any;
    const uid = await result.queryFn();

    expect(uid).toBeNull();
  });
});
