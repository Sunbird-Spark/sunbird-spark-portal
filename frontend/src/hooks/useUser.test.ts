import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUserId, useIsMentor } from './useUser';
const mockUseAuthInfo = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('./useAuthInfo', () => ({
  useAuthInfo: () => mockUseAuthInfo(),
}));

vi.mock('../services/UserService', () => ({
  UserService: class {
    getUserRoles = vi.fn();
  },
}));

describe('useCurrentUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: auth info with user ID
    mockUseAuthInfo.mockReturnValue({
      data: { sid: 'session-123', uid: 'user-123', isAuthenticated: true },
      isSuccess: true,
    });
  });

  it('uses the correct query key and staleTime', () => {
    (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);

    const result = useCurrentUserId() as any;

    expect(useQuery).toHaveBeenCalled();
    expect(result.queryKey).toEqual(['currentUserId', 'user-123']);
    expect(result.staleTime).toBe(5 * 60 * 1000);
    expect(result.retry).toBe(1);
  });

  it('returns uid from cache when getUserId has a value', async () => {
    const cachedUid = 'cdee2eb6-d1d6-43bd-b18d-959213006510';
    mockUseAuthInfo.mockReturnValue({
      data: { sid: 'session-123', uid: cachedUid, isAuthenticated: true },
      isSuccess: true,
    });
    (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);

    const result = useCurrentUserId() as any;
    const uid = await result.queryFn();

    expect(uid).toBe(cachedUid);
  });

  it('falls back to getAuthInfo when getUserId returns null', async () => {
    const fetchedUid = 'cdee2eb6-d1d6-43bd-b18d-959213006510';
    mockUseAuthInfo.mockReturnValue({
      data: { sid: 'session-456', uid: fetchedUid, isAuthenticated: true },
      isSuccess: true,
    });
    (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);

    const result = useCurrentUserId() as any;
    const uid = await result.queryFn();

    expect(uid).toBe(fetchedUid);
  });

  it('returns null when both getUserId and getAuthInfo return no uid', async () => {
    mockUseAuthInfo.mockReturnValue({
      data: { sid: 'session-789', uid: null, isAuthenticated: false },
      isSuccess: true,
    });
    (useQuery as import('vitest').Mock).mockImplementation((opts) => opts);

    const result = useCurrentUserId() as any;
    const uid = await result.queryFn();

    expect(uid).toBeNull();
  });
});

describe('useIsMentor', () => {
  it('returns true if the user has COURSE_MENTOR role', () => {
    (useQuery as import('vitest').Mock).mockReturnValue({
      data: [{ role: 'COURSE_MENTOR' }]
    });
    expect(useIsMentor()).toBe(true);
  });

  it('returns false if the user does not have COURSE_MENTOR role', () => {
    (useQuery as import('vitest').Mock).mockReturnValue({
      data: [{ role: 'CONTENT_CREATOR' }]
    });
    expect(useIsMentor()).toBe(false);
  });
});
