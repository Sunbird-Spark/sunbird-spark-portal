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
    // Get singleton instance
    service = UserProfileService.getInstance();
    // Reset internal state by re-initializing
    (service as any).isInitialized = false;
    (service as any).channel = null;
  });

  describe('initialize', () => {
    it('should fetch and store channel on initialization', async () => {
      mocks.userRead.mockResolvedValue({
        data: { response: { channel: 'org-channel' } },
      });

      await service.initialize();

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

    it('should handle concurrent initialization calls without duplicate API requests', async () => {
      mocks.userRead.mockResolvedValue({
        data: { response: { channel: 'concurrent-channel' } },
      });

      // Simulate concurrent calls
      const [result1, result2, result3] = await Promise.all([
        service.initialize(),
        service.initialize(),
        service.initialize(),
      ]);

      // Should only call API once despite 3 concurrent calls
      expect(mocks.userRead).toHaveBeenCalledTimes(1);
    });

    it('should handle missing userId gracefully', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await service.initialize();

      expect(mocks.userRead).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'UserProfileService: No userId available for initialization'
      );
      consoleSpy.mockRestore();
    });

    it('should handle userRead failure and allow retry', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mocks.userRead.mockRejectedValueOnce(new Error('network error'));

      await expect(service.initialize()).rejects.toThrow('network error');

      expect(consoleSpy).toHaveBeenCalledWith(
        'UserProfileService: Failed to initialize user profile:',
        expect.any(Error)
      );
      
      // Should allow retry after failure
      mocks.userRead.mockResolvedValue({
        data: { response: { channel: 'retry-channel' } },
      });
      
      await service.initialize();
      expect(mocks.userRead).toHaveBeenCalledTimes(2);
      
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
    });

    it('should return empty string when channel is null', async () => {
      mocks.userRead.mockResolvedValue({
        data: { response: { channel: null } },
      });

      const channel = await service.getChannel();

      expect(channel).toBe('');
    });

    it('should return empty string when channel is undefined', async () => {
      mocks.userRead.mockResolvedValue({
        data: { response: {} },
      });

      const channel = await service.getChannel();

      expect(channel).toBe('');
    });
  });
});
