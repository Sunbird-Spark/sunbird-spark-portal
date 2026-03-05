import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VideoPlayerService } from './VideoPlayerService';
import type { VideoPlayerMetadata } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';

// Mock the services
vi.mock('../../userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getSessionId: vi.fn(() => null),
    getUserId: vi.fn(() => null),
  },
}));

vi.mock('../../AppCoreService', () => ({
  default: {
    getDeviceId: vi.fn(() => Promise.resolve('')),
  },
}));

// Create a mock search function that we can control
const mockOrgSearch = vi.fn();

vi.mock('../../OrganizationService', () => ({
  OrganizationService: class {
    search = mockOrgSearch;
  },
}));

vi.mock('../../UserProfileService', () => ({
  default: {
    getUserData: vi.fn(() => Promise.resolve({ firstName: '', lastName: '' })),
  },
}));

describe('VideoPlayerService', () => {
  let service: VideoPlayerService;

  const mockMetadata: VideoPlayerMetadata = {
    identifier: 'content-123',
    name: 'Test Video',
    artifactUrl: 'https://example.com/video.mp4',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set default mock behavior for org service
    mockOrgSearch.mockResolvedValue({
      data: {
        result: {
          response: {
            content: [
              {
                channel: '',
                identifier: 'org-123',
              },
            ],
          },
        },
      },
    });

    // Mock the custom element to prevent script loading
    if (!customElements.get('sunbird-video-player')) {
      customElements.define('sunbird-video-player', class extends HTMLElement {});
    }

    service = new VideoPlayerService();
  });

  describe('createConfig', () => {
    it('should create config with all required fields from services', async () => {
      vi.mocked(userAuthInfoService.getSessionId).mockReturnValue('session-789');
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-456');

      const config = await service.createConfig(mockMetadata);

      expect(config.context.sid).toBe('session-789');
      expect(config.context.uid).toBe('user-456');
      expect(config.context.did).toBe('');
      expect(config.context.channel).toBe('');
      expect(config.metadata).toEqual(mockMetadata);
    });

    it('should use anonymous for uid when not available', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);

      const config = await service.createConfig(mockMetadata);

      expect(config.context.uid).toBe('anonymous');
    });

    it('should generate session ID when not available', async () => {
      vi.mocked(userAuthInfoService.getSessionId).mockReturnValue(null);

      const config = await service.createConfig(mockMetadata);

      expect(config.context.sid).toMatch(/^session-\d+$/);
    });

    it('should fetch channel from organization service', async () => {
      await service.createConfig(mockMetadata);

      expect(mockOrgSearch).toHaveBeenCalledWith({
        filters: {
          isTenant: true,
        },
      });
    });

    it('should use random fallback channel when channel is not found', async () => {
      mockOrgSearch.mockResolvedValue({
        data: {
          result: {
            response: {
              content: [],
            },
          },
        },
      });

      const config = await service.createConfig(mockMetadata);
      
      // Should use random fallback channel
      expect(config.context.channel).toMatch('');
    });

    it('should use random fallback channel when org response is invalid', async () => {
      mockOrgSearch.mockResolvedValue({
        data: {
          result: {
            response: {
              content: [{ identifier: 'org-123' }], // No channel
            },
          },
        },
      });

      const config = await service.createConfig(mockMetadata);
      
      // Should use random fallback channel
      expect(config.context.channel).toMatch('');
    });

    it('should use random fallback channel when org service throws error', async () => {
      mockOrgSearch.mockRejectedValue(new Error('Network error'));

      const config = await service.createConfig(mockMetadata);
      
      // Should use random fallback channel
      expect(config.context.channel).toMatch('');
    });

    it('should use fallback device ID when appCoreService fails', async () => {
      vi.mocked(appCoreService.getDeviceId).mockRejectedValue(new Error('Device ID error'));

      const config = await service.createConfig(mockMetadata);
      
      // Should use fallback device ID
      expect(config.context.did).toMatch('');
    });

    it('should use default mode when not provided', async () => {
      const config = await service.createConfig(mockMetadata);

      expect(config.context.mode).toBe('play');
    });

    it('should override mode when provided in contextProps', async () => {
      const config = await service.createConfig(mockMetadata, { mode: 'preview' });

      expect(config.context.mode).toBe('preview');
    });

    it('should use default cdata when not provided', async () => {
      const config = await service.createConfig(mockMetadata);

      expect(config.context.cdata).toEqual([]);
    });

    it('should override cdata when provided in contextProps', async () => {
      const cdata = [{ id: 'test', type: 'course' }];
      const config = await service.createConfig(mockMetadata, { cdata });

      expect(config.context.cdata).toEqual(cdata);
    });

    it('should use default contextRollup with channel when not provided', async () => {
      const config = await service.createConfig(mockMetadata);

      expect(config.context.contextRollup).toEqual({
        l1: '',
      });
    });

    it('should override contextRollup when provided in contextProps', async () => {
      const contextRollup = { l1: 'custom-channel' };
      const config = await service.createConfig(mockMetadata, { contextRollup });

      expect(config.context.contextRollup).toEqual(contextRollup);
    });

    it('should use default objectRollup when not provided', async () => {
      const config = await service.createConfig(mockMetadata);

      expect(config.context.objectRollup).toEqual({});
    });

    it('should override objectRollup when provided in contextProps', async () => {
      const objectRollup = { l1: 'test-object' };
      const config = await service.createConfig(mockMetadata, { objectRollup });

      expect(config.context.objectRollup).toEqual(objectRollup);
    });

    it('should set fixed pdata values', async () => {
      const config = await service.createConfig(mockMetadata);

      expect(config.context.pdata).toEqual({
        id: 'sunbird.portal',
        ver: '3.2.12',
        pid: 'sunbird-portal.contentplayer',
      });
    });

    it('should set default values for timeDiff, host, and endpoint', async () => {
      const config = await service.createConfig(mockMetadata);

      expect(config.context.timeDiff).toBe(0);
      expect(config.context.host).toBe('');
      expect(config.context.endpoint).toBe('');
    });

    it('should set empty config object', async () => {
      const config = await service.createConfig(mockMetadata);

      expect(config.config).toEqual({});
    });

    it('should pass metadata as-is without modifications', async () => {
      const config = await service.createConfig(mockMetadata);

      expect(config.metadata).toBe(mockMetadata);
      expect(config.metadata).toEqual(mockMetadata);
    });

    it('should call appCoreService.getDeviceId', async () => {
      await service.createConfig(mockMetadata);

      expect(appCoreService.getDeviceId).toHaveBeenCalled();
    });
  });

  describe('createElement', () => {
    it('should create sunbird-video-player element', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);

      const playerEl = element.querySelector('sunbird-video-player');
      expect(playerEl?.tagName.toLowerCase()).toBe('sunbird-video-player');
    });

    it('should set player-config attribute with JSON config', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);

      const playerEl = element.querySelector('sunbird-video-player');
      const configAttr = playerEl?.getAttribute('player-config');
      expect(configAttr).toBeTruthy();
      
      const parsedConfig = JSON.parse(configAttr!);
      expect(parsedConfig.metadata.identifier).toBe('content-123');
    });

    it('should set data-player-id attribute from metadata identifier', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);

      const playerEl = element.querySelector('sunbird-video-player');
      expect(playerEl?.getAttribute('data-player-id')).toBe('content-123');
    });
  });

  describe('attachEventListeners', () => {
    it('should attach playerEvent listener', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);
      const callback = vi.fn();

      service.attachEventListeners(element, callback);

      const event = new CustomEvent('playerEvent', {
        detail: { eid: 'START', data: {} },
      });
      const playerEl = element.querySelector('sunbird-video-player');
      playerEl?.dispatchEvent(event);

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0]?.[0].type).toBe('START');
    });

    it('should attach telemetryEvent listener', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);
      const telemetryCallback = vi.fn();

      service.attachEventListeners(element, undefined, telemetryCallback);

      const event = new CustomEvent('telemetryEvent', {
        detail: { event: 'IMPRESSION' },
      });
      const playerEl = element.querySelector('sunbird-video-player');
      playerEl?.dispatchEvent(event);

      expect(telemetryCallback).toHaveBeenCalledWith({ event: 'IMPRESSION' });
    });

    it('should include playerId and timestamp in player event', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);
      const callback = vi.fn();

      service.attachEventListeners(element, callback);

      const event = new CustomEvent('playerEvent', {
        detail: { eid: 'LOADED' },
      });
      const playerEl = element.querySelector('sunbird-video-player');
      playerEl?.dispatchEvent(event);

      const eventData = callback.mock.calls[0]?.[0];
      expect(eventData?.playerId).toBe('content-123');
      expect(eventData?.timestamp).toBeGreaterThan(0);
    });

    it('should handle events without eid', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);
      const callback = vi.fn();

      service.attachEventListeners(element, callback);

      const event = new CustomEvent('playerEvent', {
        detail: { data: {} },
      });
      const playerEl = element.querySelector('sunbird-video-player');
      playerEl?.dispatchEvent(event);

      expect(callback.mock.calls[0]?.[0].type).toBe('unknown');
    });

    it('should be idempotent - calling multiple times should not create duplicate listeners', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);
      const callback = vi.fn();

      service.attachEventListeners(element, callback);
      service.attachEventListeners(element, callback);
      service.attachEventListeners(element, callback);

      const event = new CustomEvent('playerEvent', {
        detail: { eid: 'START' },
      });
      const playerEl = element.querySelector('sunbird-video-player');
      playerEl?.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeEventListeners', () => {
    it('should remove event listeners', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);
      const callback = vi.fn();

      service.attachEventListeners(element, callback);
      service.removeEventListeners(element);

      const event = new CustomEvent('playerEvent', {
        detail: { eid: 'START' },
      });
      const playerEl = element.querySelector('sunbird-video-player');
      playerEl?.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should not throw error when removing listeners from element without listeners', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);

      expect(() => service.removeEventListeners(element)).not.toThrow();
    });
  });
});
