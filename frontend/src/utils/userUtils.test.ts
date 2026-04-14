import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveUserAndOrg } from './userUtils';

const { mockGetUserId, mockGetAuthInfo, mockUserRead } = vi.hoisted(() => ({
  mockGetUserId: vi.fn(),
  mockGetAuthInfo: vi.fn(),
  mockUserRead: vi.fn(),
}));

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getUserId: mockGetUserId,
    getAuthInfo: mockGetAuthInfo,
  },
}));

vi.mock('@/services/UserService', () => ({
  userService: {
    userRead: mockUserRead,
  },
}));

describe('resolveUserAndOrg', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns userId, rootOrgId, and full userName when firstName and lastName are present', async () => {
    mockGetUserId.mockReturnValue('user-abc');
    mockUserRead.mockResolvedValue({
      data: {
        response: {
          rootOrgId: 'org-123',
          firstName: 'John',
          lastName: 'Doe',
        },
      },
    });

    const result = await resolveUserAndOrg();

    expect(result).toEqual({ userId: 'user-abc', rootOrgId: 'org-123', userName: 'John Doe' });
  });

  it('falls back to userId as userName when firstName and lastName are missing', async () => {
    mockGetUserId.mockReturnValue('user-abc');
    mockUserRead.mockResolvedValue({
      data: {
        response: {
          rootOrgId: 'org-123',
        },
      },
    });

    const result = await resolveUserAndOrg();

    expect(result.userName).toBe('user-abc');
  });

  it('uses only firstName when lastName is missing', async () => {
    mockGetUserId.mockReturnValue('user-abc');
    mockUserRead.mockResolvedValue({
      data: {
        response: {
          rootOrgId: 'org-xyz',
          firstName: 'Alice',
        },
      },
    });

    const result = await resolveUserAndOrg();

    expect(result.userName).toBe('Alice');
  });

  it('falls back to getAuthInfo when getUserId returns null', async () => {
    mockGetUserId.mockReturnValue(null);
    mockGetAuthInfo.mockResolvedValue({ uid: 'user-from-auth', sid: 'sid-1', isAuthenticated: true });
    mockUserRead.mockResolvedValue({
      data: {
        response: {
          rootOrgId: 'org-999',
          firstName: 'Bob',
          lastName: 'Smith',
        },
      },
    });

    const result = await resolveUserAndOrg();

    expect(mockGetAuthInfo).toHaveBeenCalled();
    expect(result.userId).toBe('user-from-auth');
    expect(result.userName).toBe('Bob Smith');
  });

  it('throws when userId is null and getAuthInfo returns null uid', async () => {
    mockGetUserId.mockReturnValue(null);
    mockGetAuthInfo.mockResolvedValue({ uid: null, sid: '', isAuthenticated: false });

    await expect(resolveUserAndOrg()).rejects.toThrow('User not authenticated');
  });

  it('defaults rootOrgId to empty string when missing from response', async () => {
    mockGetUserId.mockReturnValue('user-abc');
    mockUserRead.mockResolvedValue({
      data: {
        response: {
          firstName: 'Jane',
        },
      },
    });

    const result = await resolveUserAndOrg();

    expect(result.rootOrgId).toBe('');
  });
});
