import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QumlPlayerService } from './QumlPlayerService';
import type { QumlPlayerMetadata } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';

// Mock dependencies
vi.mock('../../userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getSessionId: vi.fn(),
    getUserId: vi.fn(),
  },
}));

vi.mock('../../AppCoreService', () => ({
  default: {
    getDeviceId: vi.fn(),
    getPData: vi.fn(),
  },
}));

vi.mock('../../OrganizationService', () => ({
  OrganizationService: class {
    search = vi.fn();
  },
}));

describe('QumlPlayerService', () => {
  let service: QumlPlayerService;
  let mockOrgService: any;

  const mockMetadata: QumlPlayerMetadata = {
    identifier: 'do_123',
    name: 'Test Question Set',
    mimeType: 'application/vnd.sunbird.questionset',
    channel: 'test-channel',
  };

  beforeEach(() => {
    // Mock the custom element to prevent script loading
    if (!customElements.get('sunbird-quml-player')) {
      customElements.define('sunbird-quml-player', class extends HTMLElement {});
    }

    service = new QumlPlayerService();
    mockOrgService = (service as any).orgService;

    // Setup default mocks
    vi.mocked(userAuthInfoService.getSessionId).mockReturnValue('session-123');
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-123');
    vi.mocked(appCoreService.getDeviceId).mockResolvedValue('device-123');
    vi.mocked(appCoreService.getPData).mockResolvedValue({
      id: 'sunbird.portal',
      ver: '3.2.12',
      pid: 'sunbird.portal.contentplayer',
    });
    mockOrgService.search.mockResolvedValue({
      data: {
        result: {
          response: {
            content: [{ channel: 'org-channel' }],
          },
        },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createConfig', () => {
    it('should create config with session, device, and channel', async () => {
      const config = await service.createConfig(mockMetadata);

      expect(config.context.sid).toBe('session-123');
      expect(config.context.uid).toBe('user-123');
      expect(config.context.did).toBe('device-123');
      expect(config.context.channel).toBe('org-channel');
      expect(config.metadata).toEqual(mockMetadata);
    });

    it('should use fallback session ID when not available', async () => {
      vi.mocked(userAuthInfoService.getSessionId).mockReturnValue(null);

      const config = await service.createConfig(mockMetadata);

      expect(config.context.sid).toMatch(/^session-\d+$/);
    });

    it('should use fallback user ID when not available', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);

      const config = await service.createConfig(mockMetadata);

      expect(config.context.uid).toBe('anonymous');
    });

    it('should use empty device ID when fetch fails', async () => {
      vi.mocked(appCoreService.getDeviceId).mockRejectedValue(new Error('Failed'));

      const config = await service.createConfig(mockMetadata);

      expect(config.context.did).toBe('');
    });

    it('should use empty channel when org service fails', async () => {
      mockOrgService.search.mockRejectedValue(new Error('Failed'));

      const config = await service.createConfig(mockMetadata);

      expect(config.context.channel).toBe('');
    });

    it('should use empty channel when metadata has no channel and org service fails', async () => {
      mockOrgService.search.mockRejectedValue(new Error('Failed'));
      const metadataWithoutChannel = { ...mockMetadata, channel: undefined };

      const config = await service.createConfig(metadataWithoutChannel);

      expect(config.context.channel).toBe('');
    });

    it('should apply context props', async () => {
      const contextProps = {
        mode: 'review',
        cdata: [{ id: 'course-1', type: 'Course' }],
        contextRollup: { l1: 'custom-rollup' },
        objectRollup: { l1: 'object-1' },
      };

      const config = await service.createConfig(mockMetadata, contextProps);

      expect(config.context.mode).toBe('review');
      expect(config.context.cdata).toEqual(contextProps.cdata);
      expect(config.context.contextRollup).toEqual(contextProps.contextRollup);
      expect(config.context.objectRollup).toEqual(contextProps.objectRollup);
    });

    it('should use default mode when not provided', async () => {
      const config = await service.createConfig(mockMetadata);

      expect(config.context.mode).toBe('play');
    });

    it('should set pdata correctly', async () => {
      const config = await service.createConfig(mockMetadata);

      expect(config.context.pdata).toEqual({
        id: 'sunbird.portal',
        ver: '3.2.12',
        pid: 'sunbird.portal.contentplayer',
      });
    });

    it('should initialize config and data as empty objects', async () => {
      const config = await service.createConfig(mockMetadata);

      expect(config.config).toEqual({});
    });
  });

  describe('createElement', () => {
    it('should create sunbird-quml-player element with config', () => {
      const config = {
        context: { sid: 'test' },
        config: {},
        metadata: mockMetadata,
        data: {},
      };

      const element = service.createElement(config);

      expect(element.tagName.toLowerCase()).toBe('sunbird-quml-player');
      expect(element.getAttribute('data-player-id')).toBe('do_123');
    });
  });
});
