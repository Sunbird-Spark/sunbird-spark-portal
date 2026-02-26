import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create a mock container that can be accessed later
const mocks = {
  userRead: vi.fn(),
};

// Mock modules before imports
vi.mock('./UserService', () => {
  return {
    UserService: class MockUserService {
      get userRead() {
        return mocks.userRead;
      }
    },
  };
});

vi.mock('./userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getUserId: vi.fn(() => 'user-123'),
  },
}));

// Import after mocks are set up
import { UserProfileService } from './UserProfileService';
import userAuthInfoService from './userAuthInfoService/userAuthInfoService';

describe('UserProfileService', () => {
  let service: UserProfileService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset getUserId mock to default value
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-123');
    // Get singleton instance and reset it
    service = UserProfileService.getInstance();
    service.reset();
  });

  describe('initialize', () => {
    it('should fetch and store channel on initialization', async () => {
      mocks.userRead.mockResolvedValue({
        data: { response: { channel: 'org-channel' } },
      });

      await service.initialize();

      expect(service.isReady()).toBe(true);
      expect(service.getChannelSync()).toBe('org-channel');
      expect(mocks.userRead).toHaveBeenCalledWith('user-123');
    });

    it('should not fetch again if already initialized', async () => {
      mocks.userRead.mockResolvedValue({
        data: { response: { channel: 'my-channel' } },
      });

      await service.initialize();
      await service.initialize();

      expect(mocks.userRead).toHaveBeenCalledTimes(1);
    });

    it('should handle missing userId gracefully', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await service.initialize();

      expect(service.isReady()).toBe(true);
      expect(service.getChannelSync()).toBe('');
      expect(mocks.userRead).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'UserProfileService: No userId available for initialization'
      );
      consoleSpy.mockRestore();
    });

    it('should handle userRead failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mocks.userRead.mockRejectedValue(new Error('network error'));

      // Service catches errors internally and throws them
      await expect(service.initialize()).rejects.toThrow('network error');

      expect(service.isReady()).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'UserProfileService: Failed to initialize user profile:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
      
      // Reset for next test
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-123');
    });
  });

  describe('getChannel', () => {
    it('should return channel after initialization', async () => {
      mocks.userRead.mockResolvedValue({
        data: { response: { channel: 'test-channel' } },
      });

      await service.initialize();
      const channel = await service.getChannel();

      expect(channel).toBe('test-channel');
    });

    it('should initialize if not already initialized', async () => {
      mocks.userRead.mockResolvedValue({
        data: { response: { channel: 'auto-init-channel' } },
      });

      const channel = await service.getChannel();

      expect(channel).toBe('auto-init-channel');
      expect(service.isReady()).toBe(true);
    });

    it('should return empty string when channel is null', async () => {
      mocks.userRead.mockResolvedValue({
        data: { response: { channel: null } },
      });

      const channel = await service.getChannel();

      expect(channel).toBe('');
    });
  });

  describe('getChannelSync', () => {
    it('should return channel synchronously after initialization', async () => {
      mocks.userRead.mockResolvedValue({
        data: { response: { channel: 'sync-channel' } },
      });

      await service.initialize();
      const channel = service.getChannelSync();

      expect(channel).toBe('sync-channel');
    });

    it('should return empty string before initialization', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const channel = service.getChannelSync();

      expect(channel).toBe('');
      expect(consoleSpy).toHaveBeenCalledWith(
        'UserProfileService: getChannelSync called before initialization'
      );
      consoleSpy.mockRestore();
    });

    it('should return empty string when channel is null', async () => {
      mocks.userRead.mockResolvedValue({
        data: { response: {} },
      });

      await service.initialize();
      const channel = service.getChannelSync();

      expect(channel).toBe('');
    });
  });

  describe('isReady', () => {
    it('should return false before initialization', () => {
      expect(service.isReady()).toBe(false);
    });

    it('should return true after initialization', async () => {
      mocks.userRead.mockResolvedValue({
        data: { response: { channel: 'test' } },
      });

      await service.initialize();

      expect(service.isReady()).toBe(true);
    });

    it('should return true even after failed initialization', async () => {
      mocks.userRead.mockRejectedValue(new Error('fail'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await service.initialize();
      } catch (e) {
        // Expected to throw
      }

      expect(service.isReady()).toBe(true);
    });
  });

  describe('reset', () => {
    it('should clear channel and reset initialization state', async () => {
      mocks.userRead.mockResolvedValue({
        data: { response: { channel: 'first-channel' } },
      });

      await service.initialize();
      expect(service.isReady()).toBe(true);
      expect(service.getChannelSync()).toBe('first-channel');

      service.reset();

      expect(service.isReady()).toBe(false);
      expect(service.getChannelSync()).toBe('');
    });

    it('should allow re-initialization after reset', async () => {
      mocks.userRead.mockResolvedValue({
        data: { response: { channel: 'first-channel' } },
      });

      await service.initialize();
      service.reset();

      mocks.userRead.mockResolvedValue({
        data: { response: { channel: 'second-channel' } },
      });

      await service.initialize();

      expect(service.getChannelSync()).toBe('second-channel');
      expect(mocks.userRead).toHaveBeenCalledTimes(2);
    });
  });
});
