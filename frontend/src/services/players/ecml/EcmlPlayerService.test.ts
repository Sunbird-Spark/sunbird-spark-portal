import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EcmlPlayerService } from './EcmlPlayerService';
import type { EcmlPlayerMetadata } from './types';
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
    getPData: vi.fn(() => Promise.resolve({ id: 'test.portal', ver: '1.0.0', pid: 'test.portal' })),
  },
}));

const mockOrgSearch = vi.fn();

vi.mock('../../OrganizationService', () => ({
  OrganizationService: class {
    search = mockOrgSearch;
  },
}));

describe('EcmlPlayerService', () => {
  let service: EcmlPlayerService;

  const mockMetadata: EcmlPlayerMetadata = {
    identifier: 'do_content_123',
    name: 'Test ECML Content',
    artifactUrl: 'https://example.com/content.ecar',
    pkgVersion: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockOrgSearch.mockResolvedValue({
      data: {
        result: {
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
      },
    });

    service = new EcmlPlayerService();
  });

  describe('createConfig', () => {
    it('should create config with all required fields from services', async () => {
      vi.mocked(userAuthInfoService.getSessionId).mockReturnValue('session-789');
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-456');

      const result = await service.createConfig(mockMetadata);

      expect(result.context.sid).toBe('session-789');
      expect(result.context.uid).toBe('user-456');
      expect(result.context.did).toBe('device-123');
      expect(result.context.channel).toBe('test-channel-456');
      expect(result.context.contentId).toBe('do_content_123');
      expect(result.metadata).toEqual(mockMetadata);
    });

    it('should use anonymous for uid when not available', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);

      const result = await service.createConfig(mockMetadata);
      expect(result.context.uid).toBe('anonymous');
    });

    it('should use null sid when session ID is not available', async () => {
      vi.mocked(userAuthInfoService.getSessionId).mockReturnValue(null);

      const result = await service.createConfig(mockMetadata);
      expect(result.context.sid).toBeNull();
    });

    it('should use empty fallback when device ID fails', async () => {
      vi.mocked(appCoreService.getDeviceId).mockRejectedValue(new Error('fail'));

      const result = await service.createConfig(mockMetadata);
      expect(result.context.did).toBe('');
    });

    it('should use empty fallback when org service fails', async () => {
      mockOrgSearch.mockRejectedValue(new Error('Network error'));

      const result = await service.createConfig(mockMetadata);
      expect(result.context.channel).toBe('');
    });

    it('should use empty fallback when channel is not found', async () => {
      mockOrgSearch.mockResolvedValue({
        data: { result: { response: { content: [] } } },
      });

      const result = await service.createConfig(mockMetadata);
      expect(result.context.channel).toBe('');
    });

    it('should use hashTagId for tags when available', async () => {
      const result = await service.createConfig(mockMetadata);
      expect(result.context.tags).toEqual(['hash-tag-123']);
      expect(result.context.dims).toEqual(['hash-tag-123']);
    });

    it('should use channel for tags when hashTagId is not available', async () => {
      mockOrgSearch.mockResolvedValue({
        data: {
          result: {
            response: {
              content: [{ channel: 'my-channel', identifier: 'org-1' }],
            },
          },
        },
      });

      const result = await service.createConfig(mockMetadata);
      expect(result.context.tags).toEqual(['my-channel']);
    });

    it('should use empty tags when no channel or hashTagId', async () => {
      mockOrgSearch.mockResolvedValue({
        data: { result: { response: { content: [] } } },
      });

      const result = await service.createConfig(mockMetadata);
      expect(result.context.tags).toEqual([]);
    });

    it('should override mode when provided in contextProps', async () => {
      const result = await service.createConfig(mockMetadata, { mode: 'preview' });
      expect(result.context.mode).toBe('preview');
    });

    it('should use default mode when not provided', async () => {
      const result = await service.createConfig(mockMetadata);
      expect(result.context.mode).toBe('play');
    });

    it('should override cdata when provided', async () => {
      const cdata = [{ id: 'test', type: 'course' }];
      const result = await service.createConfig(mockMetadata, { cdata });
      expect(result.context.cdata).toEqual(cdata);
    });

    it('should override contextRollup when provided', async () => {
      const contextRollup = { l1: 'custom-channel' };
      const result = await service.createConfig(mockMetadata, { contextRollup });
      expect(result.context.contextRollup).toEqual(contextRollup);
    });

    it('should override objectRollup when provided', async () => {
      const objectRollup = { l1: 'test-object' };
      const result = await service.createConfig(mockMetadata, { objectRollup });
      expect(result.context.objectRollup).toEqual(objectRollup);
    });

    it('should include ECML-specific config fields', async () => {
      const result = await service.createConfig(mockMetadata);

      expect(result.config.apislug).toBe('/action');
      expect(result.config.repos).toEqual(['/content-plugins/renderer']);
      expect(result.config.plugins).toHaveLength(2);
      expect(result.config.showStartPage).toBe(true);
      expect(result.config.enableTelemetryValidation).toBe(false);
    });

    it('should include body data from metadata', async () => {
      const metadataWithBody = { ...mockMetadata, body: { theme: { stage: [] } } };
      const result = await service.createConfig(metadataWithBody);
      expect(result.data).toEqual({ theme: { stage: [] } });
    });

    it('should use empty object when body is not available', async () => {
      const result = await service.createConfig(mockMetadata);
      expect(result.data).toEqual({});
    });

    it('should set host to empty string', async () => {
      const result = await service.createConfig(mockMetadata);
      expect(result.context.host).toBe('');
    });

    it('should set telemetry endpoint', async () => {
      const result = await service.createConfig(mockMetadata);
      expect(result.context.endpoint).toBe('/portal/data/v1/telemetry');
    });
  });

  describe('buildPlayerUrl', () => {
    it('should return the preview URL', () => {
      expect(service.buildPlayerUrl()).toBe('/content/preview/preview.html?webview=true');
    });
  });
});
