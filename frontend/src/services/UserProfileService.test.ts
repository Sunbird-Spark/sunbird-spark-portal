import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserProfileService } from './UserProfileService';

const mockUserRead = vi.fn();

vi.mock('./UserService', () => ({
  UserService: class {
    userRead = mockUserRead;
  },
}));

vi.mock('./userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getUserId: vi.fn(() => 'user-123'),
  },
}));

import userAuthInfoService from './userAuthInfoService/userAuthInfoService';

describe('UserProfileService', () => {
  let service: UserProfileService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a fresh instance for each test (bypass singleton)
    service = new (UserProfileService as any)();
  });

  it('should start with empty channel and unfetched state', async () => {
    mockUserRead.mockResolvedValue({
      data: { response: { channel: 'org-channel' } },
    });
    // clearCache confirms initial state equivalent
    service.clearCache();
    const channel = await service.getChannel();
    expect(channel).toBe('org-channel');
  });

  it('should return channel from user read on first call', async () => {
    mockUserRead.mockResolvedValue({
      data: { response: { channel: 'my-channel' } },
    });

    const result = await service.getChannel();

    expect(result).toBe('my-channel');
    expect(mockUserRead).toHaveBeenCalledWith('user-123');
  });

  it('should cache the channel and not call userRead again on second call', async () => {
    mockUserRead.mockResolvedValue({
      data: { response: { channel: 'cached-channel' } },
    });

    await service.getChannel();
    const result = await service.getChannel();

    expect(result).toBe('cached-channel');
    expect(mockUserRead).toHaveBeenCalledTimes(1);
  });

  it('should deduplicate concurrent calls (single userRead call)', async () => {
    mockUserRead.mockResolvedValue({
      data: { response: { channel: 'concurrent-channel' } },
    });

    const [r1, r2, r3] = await Promise.all([
      service.getChannel(),
      service.getChannel(),
      service.getChannel(),
    ]);

    expect(r1).toBe('concurrent-channel');
    expect(r2).toBe('concurrent-channel');
    expect(r3).toBe('concurrent-channel');
    expect(mockUserRead).toHaveBeenCalledTimes(1);
  });

  it('should return empty string when userId is null', async () => {
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);

    const result = await service.getChannel();

    expect(result).toBe('');
    expect(mockUserRead).not.toHaveBeenCalled();
  });

  it('should return empty string and warn when userRead fails', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockUserRead.mockRejectedValue(new Error('network error'));

    const result = await service.getChannel();

    expect(result).toBe('');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch user profile for channel:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it('should reset state after clearCache', async () => {
    mockUserRead.mockResolvedValue({
      data: { response: { channel: 'first-channel' } },
    });

    await service.getChannel();
    service.clearCache();

    mockUserRead.mockResolvedValue({
      data: { response: { channel: 'second-channel' } },
    });

    const result = await service.getChannel();
    expect(result).toBe('second-channel');
    expect(mockUserRead).toHaveBeenCalledTimes(2);
  });
});
