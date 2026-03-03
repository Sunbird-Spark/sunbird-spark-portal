import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentEditorService } from './ContentEditorService';
import type { ContentEditorMetadata } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';

vi.mock('../../userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getSessionId: vi.fn(() => null),
    getUserId: vi.fn(() => null),
  },
}));

vi.mock('../../AppCoreService', () => ({
  default: {
    getDeviceId: vi.fn(() => Promise.resolve('device-123')),
    getPData: vi.fn(() =>
      Promise.resolve({ id: 'test.portal', ver: '1.0.0', pid: 'test.portal' })
    ),
  },
}));

const mockOrgSearch = vi.hoisted(() => vi.fn());
const mockChannelRead = vi.hoisted(() => vi.fn());

vi.mock('../../OrganizationService', () => ({
  OrganizationService: class {
    search = mockOrgSearch;
  },
}));

vi.mock('../../UserProfileService', () => ({
  default: { getChannel: vi.fn(), clearCache: vi.fn() },
}));

import userProfileService from '../../UserProfileService';

vi.mock('../../ChannelService', () => ({
  ChannelService: class {
    read = mockChannelRead;
  },
}));

describe('ContentEditorService', () => {
  let service: ContentEditorService;

  const mockMetadata: ContentEditorMetadata = {
    identifier: 'do_content_123',
    name: 'Test Content',
    mimeType: 'application/vnd.ekstep.ecml-archive',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockOrgSearch.mockResolvedValue({
      data: {
        response: {
          content: [
            {
              channel: 'test-channel-456',
              hashTagId: 'hash-tag-123',
              identifier: 'org-123',
            },
          ],
        },
      },
    });

    vi.mocked(userProfileService.getChannel).mockResolvedValue('test-slug');

    mockChannelRead.mockResolvedValue({
      data: {
        channel: {
          frameworks: [{ identifier: 'NCF' }],
        },
      },
    });

    service = new ContentEditorService();
  });

  describe('buildConfig', () => {
    it('should create config with all required fields from services', async () => {
      vi.mocked(userAuthInfoService.getSessionId).mockReturnValue('session-789');
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-456');

      const result = await service.buildConfig(mockMetadata);

      expect(result.context.sid).toBe('session-789');
      expect(result.context.uid).toBe('user-456');
      expect(result.context.did).toBe('device-123');
      expect(result.context.channel).toBe('hash-tag-123');
      expect(result.context.contentId).toBe('do_content_123');
    });

    it('should use anonymous for uid when userId is not available', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);

      const result = await service.buildConfig(mockMetadata);
      expect(result.context.uid).toBe('anonymous');
    });

    it('should use empty string sid when session ID is not available', async () => {
      vi.mocked(userAuthInfoService.getSessionId).mockReturnValue(null);

      const result = await service.buildConfig(mockMetadata);
      expect(result.context.sid).toBe('');
    });

    it('should use empty fallback when device ID fails', async () => {
      vi.mocked(appCoreService.getDeviceId).mockRejectedValue(new Error('fail'));

      const result = await service.buildConfig(mockMetadata);
      expect(result.context.did).toBe('');
    });

    it('should use empty fallback when org service fails', async () => {
      mockOrgSearch.mockRejectedValue(new Error('Network error'));

      const result = await service.buildConfig(mockMetadata);
      expect(result.context.channel).toBe('');
    });

    it('should use empty fallback when channel is not found', async () => {
      mockOrgSearch.mockResolvedValue({
        data: { response: { content: [] } },
      });

      const result = await service.buildConfig(mockMetadata);
      expect(result.context.channel).toBe('');
    });

    it('should use hashTagId for tags when available', async () => {
      const result = await service.buildConfig(mockMetadata);
      expect(result.context.tags).toEqual(['hash-tag-123']);
    });

    it('should use identifier for tags when hashTagId is not available', async () => {
      mockOrgSearch.mockResolvedValue({
        data: {
          response: {
            content: [{ identifier: 'org-1' }],
          },
        },
      });

      const result = await service.buildConfig(mockMetadata);
      expect(result.context.tags).toEqual(['org-1']);
    });

    it('should use empty tags when no channel or hashTagId', async () => {
      mockOrgSearch.mockResolvedValue({
        data: { response: { content: [] } },
      });

      const result = await service.buildConfig(mockMetadata);
      expect(result.context.tags).toEqual([]);
    });

    it('should use framework from channel service', async () => {
      mockChannelRead.mockResolvedValue({
        data: {
          channel: {
            frameworks: [{ identifier: 'TPD' }],
          },
        },
      });

      const result = await service.buildConfig(mockMetadata);
      expect(result.context.framework).toBe('TPD');
    });

    it('should default to empty framework when channel service fails', async () => {
      mockChannelRead.mockRejectedValue(new Error('fail'));

      const result = await service.buildConfig(mockMetadata);
      expect(result.context.framework).toBe('');
    });

    it('should include editor-specific config fields', async () => {
      const result = await service.buildConfig(mockMetadata);

      expect(result.config.apislug).toBe('/action');
      expect(result.config.pluginRepo).toBe('/content-plugins');
      expect(result.config.plugins).toHaveLength(5);
      expect(result.config.corePluginsPackaged).toBe(true);
      expect(result.config.dispatcher).toBe('local');
      expect(result.config.modalId).toBe('contentEditor');
      expect(result.config.enableTelemetryValidation).toBe(false);
    });

    it('should include previewConfig with correct structure', async () => {
      const result = await service.buildConfig(mockMetadata);

      expect(result.config.previewConfig).toBeDefined();
      expect(result.config.previewConfig.repos).toEqual(['/content-plugins/renderer']);
      expect(result.config.previewConfig.plugins).toHaveLength(1);
      expect(result.config.previewConfig.showEndPage).toBe(false);
      expect(result.config.previewConfig.showStartPage).toBe(true);
    });

    it('should set user orgIds from tags', async () => {
      const result = await service.buildConfig(mockMetadata);
      expect(result.context.user.orgIds).toEqual(['hash-tag-123']);
    });

    it('should set contextRollup l1 to channel', async () => {
      const result = await service.buildConfig(mockMetadata);
      expect(result.context.contextRollup).toEqual({ l1: 'hash-tag-123' });
    });

    it('should set defaultLicense to CC BY 4.0', async () => {
      const result = await service.buildConfig(mockMetadata);
      expect(result.context.defaultLicense).toBe('CC BY 4.0');
    });
  });

  describe('getEditorUrl', () => {
    it('should return the content editor URL', () => {
      expect(service.getEditorUrl()).toBe('/content-editor/index.html');
    });
  });
});
