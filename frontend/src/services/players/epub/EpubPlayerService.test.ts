import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EpubPlayerService } from './EpubPlayerService';
import type { EpubPlayerConfig } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';

// Mock the auth service
vi.mock('../../userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getSessionId: vi.fn(() => null),
    getUserId: vi.fn(() => null),
  },
}));

describe('EpubPlayerService', () => {
  let service: EpubPlayerService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EpubPlayerService();
  });

  describe('createDefaultConfig', () => {
    it('should create a default configuration with provided parameters', () => {
      const config = EpubPlayerService.createDefaultConfig(
        'content-123',
        'Test EPUB',
        'https://example.com/book.epub',
        'user-456',
        'session-789'
      );

      expect(config.context.contentId).toBe('content-123');
      expect(config.context.uid).toBe('user-456');
      expect(config.context.sid).toBe('session-789');
      expect(config.metadata.name).toBe('Test EPUB');
      expect(config.metadata.artifactUrl).toBe('https://example.com/book.epub');
    });

    it('should use anonymous for uid when not provided and auth service returns null', () => {
      const config = EpubPlayerService.createDefaultConfig(
        'content-123',
        'Test EPUB',
        'https://example.com/book.epub'
      );

      expect(config.context.uid).toBe('anonymous');
      expect(config.context.sid).toMatch(/^session-\d+$/);
      expect(config.context.did).toMatch(/^device-\d+$/);
    });

    it('should use auth service values when available and not explicitly provided', () => {
      // Mock auth service to return values
      vi.mocked(userAuthInfoService.getSessionId).mockReturnValue('auth-session-123');
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue('auth-user-456');

      const config = EpubPlayerService.createDefaultConfig(
        'content-123',
        'Test EPUB',
        'https://example.com/book.epub'
      );

      expect(config.context.sid).toBe('auth-session-123');
      expect(config.context.uid).toBe('auth-user-456');
      expect(userAuthInfoService.getSessionId).toHaveBeenCalled();
      expect(userAuthInfoService.getUserId).toHaveBeenCalled();
    });

    it('should prefer explicitly provided values over auth service values', () => {
      // Mock auth service to return values
      vi.mocked(userAuthInfoService.getSessionId).mockReturnValue('auth-session-123');
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue('auth-user-456');

      const config = EpubPlayerService.createDefaultConfig(
        'content-123',
        'Test EPUB',
        'https://example.com/book.epub',
        'explicit-user',
        'explicit-session'
      );

      expect(config.context.sid).toBe('explicit-session');
      expect(config.context.uid).toBe('explicit-user');
    });

    it('should set window.location.origin as host', () => {
      const config = EpubPlayerService.createDefaultConfig(
        'content-123',
        'Test EPUB',
        'https://example.com/book.epub'
      );

      expect(config.context.host).toBe(window.location.origin);
    });

    it('should disable all side menu options by default', () => {
      const config = EpubPlayerService.createDefaultConfig(
        'content-123',
        'Test EPUB',
        'https://example.com/book.epub'
      );

      expect(config.config.sideMenu.showShare).toBe(false);
      expect(config.config.sideMenu.showDownload).toBe(false);
      expect(config.config.sideMenu.showReplay).toBe(false);
      expect(config.config.sideMenu.showExit).toBe(false);
    });

    it('should set correct metadata defaults', () => {
      const config = EpubPlayerService.createDefaultConfig(
        'content-123',
        'Test EPUB',
        'https://example.com/book.epub'
      );

      expect(config.metadata.identifier).toBe('content-123');
      expect(config.metadata.streamingUrl).toBe('');
      expect(config.metadata.compatibilityLevel).toBe(1);
      expect(config.metadata.pkgVersion).toBe(1);
    });

    it('should set correct context defaults', () => {
      const config = EpubPlayerService.createDefaultConfig(
        'content-123',
        'Test EPUB',
        'https://example.com/book.epub'
      );

      expect(config.context.mode).toBe('play');
      expect(config.context.partner).toEqual([]);
      expect(config.context.pdata.id).toBe('sunbird.portal');
      expect(config.context.pdata.ver).toBe('1.0');
      expect(config.context.pdata.pid).toBe('sunbird-portal');
      expect(config.context.channel).toBe('sunbird-portal');
      expect(config.context.tags).toEqual([]);
      expect(config.context.timeDiff).toBe(0);
      expect(config.context.endpoint).toBe('');
    });
  });

  describe('createElement', () => {
    it('should create a sunbird-epub-player element', () => {
      const config = EpubPlayerService.createDefaultConfig(
        'test-id',
        'Test',
        '/test.epub'
      );
      
      const element = service.createElement(config);
      
      expect(element.tagName.toLowerCase()).toBe('sunbird-epub-player');
      expect(element.getAttribute('data-player-id')).toBe('test-id');
      expect(element.getAttribute('player-config')).toBeTruthy();
    });

    it('should set player-config attribute with JSON config', () => {
      const config = EpubPlayerService.createDefaultConfig(
        'test-id',
        'Test',
        '/test.epub'
      );
      
      const element = service.createElement(config);
      const configAttr = element.getAttribute('player-config');
      
      expect(configAttr).toBeTruthy();
      const parsedConfig = JSON.parse(configAttr!);
      expect(parsedConfig.metadata.identifier).toBe('test-id');
    });
  });

  describe('attachEventListeners', () => {
    it('should attach playerEvent listener', () => {
      const config = EpubPlayerService.createDefaultConfig('test', 'Test', '/test.epub');
      const element = service.createElement(config);
      const callback = vi.fn();

      service.attachEventListeners(element, callback);

      const event = new CustomEvent('playerEvent', {
        detail: { eid: 'START', data: {} }
      });
      element.dispatchEvent(event);

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0]?.[0].type).toBe('START');
    });

    it('should include playerId and timestamp in event', () => {
      const config = EpubPlayerService.createDefaultConfig('test-123', 'Test', '/test.epub');
      const element = service.createElement(config);
      const callback = vi.fn();

      service.attachEventListeners(element, callback);

      const event = new CustomEvent('playerEvent', {
        detail: { eid: 'LOADED' }
      });
      element.dispatchEvent(event);

      expect(callback).toHaveBeenCalled();
      const eventData = callback.mock.calls[0]?.[0];
      expect(eventData?.playerId).toBe('test-123');
      expect(eventData?.timestamp).toBeGreaterThan(0);
    });
  });

  describe('removeEventListeners', () => {
    it('should remove event listeners', () => {
      const config = EpubPlayerService.createDefaultConfig('test', 'Test', '/test.epub');
      const element = service.createElement(config);
      const callback = vi.fn();

      service.attachEventListeners(element, callback);
      service.removeEventListeners(element);

      const event = new CustomEvent('playerEvent', {
        detail: { eid: 'START' }
      });
      element.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('mergeConfigWithUrl', () => {
    it('should merge config with epub URL', () => {
      const baseConfig: Partial<EpubPlayerConfig> = {
        context: {
          contentId: 'test-id',
          mode: 'play',
          partner: [],
          pdata: { id: 'test', ver: '1.0', pid: 'test' },
          sid: 'session',
          uid: 'user',
          timeDiff: 0,
          channel: 'test',
          tags: [],
          did: 'device',
          contextRollup: {},
          objectRollup: {},
          host: '',
          endpoint: '',
        },
        metadata: {
          name: 'Test Book',
          identifier: 'test',
          artifactUrl: '',
          streamingUrl: '',
          compatibilityLevel: 1,
          pkgVersion: 1,
        },
        config: {
          sideMenu: {
            showShare: false,
            showDownload: false,
            showReplay: false,
            showExit: false,
          },
        },
      };

      const result = EpubPlayerService.mergeConfigWithUrl(
        baseConfig,
        'https://example.com/new-book.epub'
      );

      expect(result.metadata.artifactUrl).toBe('https://example.com/new-book.epub');
      expect(result.metadata.name).toBe('Test Book');
      expect(result.context.contentId).toBe('test-id');
    });

    it('should handle empty base config', () => {
      const result = EpubPlayerService.mergeConfigWithUrl(
        {},
        '/sample.epub'
      );

      expect(result.metadata.artifactUrl).toBe('/sample.epub');
    });

    it('should preserve existing metadata fields', () => {
      const baseConfig: Partial<EpubPlayerConfig> = {
        metadata: {
          name: 'Original Name',
          identifier: 'original-id',
          artifactUrl: '/old.epub',
          streamingUrl: 'http://stream.com',
          compatibilityLevel: 2,
          pkgVersion: 3,
        },
      };

      const result = EpubPlayerService.mergeConfigWithUrl(
        baseConfig,
        '/new.epub'
      );

      expect(result.metadata.artifactUrl).toBe('/new.epub');
      expect(result.metadata.name).toBe('Original Name');
      expect(result.metadata.streamingUrl).toBe('http://stream.com');
      expect(result.metadata.compatibilityLevel).toBe(2);
      expect(result.metadata.pkgVersion).toBe(3);
    });
  });

  describe('isValidEpubUrl', () => {
    it('should return true for valid EPUB URLs', () => {
      expect(EpubPlayerService.isValidEpubUrl('https://example.com/book.epub')).toBe(true);
      expect(EpubPlayerService.isValidEpubUrl('http://example.com/path/to/book.EPUB')).toBe(true);
      expect(EpubPlayerService.isValidEpubUrl('https://example.com/book.ePub')).toBe(true);
    });

    it('should return true for relative paths', () => {
      expect(EpubPlayerService.isValidEpubUrl('/sample-epub.epub')).toBe(true);
      expect(EpubPlayerService.isValidEpubUrl('./books/sample.epub')).toBe(true);
      expect(EpubPlayerService.isValidEpubUrl('/path/to/book.EPUB')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(EpubPlayerService.isValidEpubUrl('')).toBe(false);
    });

    it('should return false for non-epub files', () => {
      expect(EpubPlayerService.isValidEpubUrl('https://example.com/book.pdf')).toBe(false);
      expect(EpubPlayerService.isValidEpubUrl('/sample.pdf')).toBe(false);
      expect(EpubPlayerService.isValidEpubUrl('./books/sample.txt')).toBe(false);
    });

    it('should return false for invalid URLs without path prefix', () => {
      expect(EpubPlayerService.isValidEpubUrl('not-a-url.epub')).toBe(false);
      expect(EpubPlayerService.isValidEpubUrl('book.epub')).toBe(false);
    });

    it('should handle URLs with query parameters', () => {
      expect(EpubPlayerService.isValidEpubUrl('https://example.com/book.epub?version=1')).toBe(true);
    });

    it('should handle URLs with fragments', () => {
      expect(EpubPlayerService.isValidEpubUrl('https://example.com/book.epub#chapter1')).toBe(true);
    });
  });

  describe('handlePlayerEvent', () => {
    it('should structure player events correctly', () => {
      const mockEvent = {
        eid: 'START',
        data: { timestamp: 123456 },
      };

      const result = EpubPlayerService.handlePlayerEvent(mockEvent);

      expect(result.type).toBe('START');
      expect(result.data).toEqual(mockEvent);
    });

    it('should handle events without eid', () => {
      const mockEvent = {
        data: { timestamp: 123456 },
      };

      const result = EpubPlayerService.handlePlayerEvent(mockEvent);

      expect(result.type).toBe('unknown');
      expect(result.data).toEqual(mockEvent);
    });

    it('should handle null event', () => {
      const result = EpubPlayerService.handlePlayerEvent(null);

      expect(result.type).toBe('unknown');
      expect(result.data).toBeNull();
    });

    it('should handle undefined event', () => {
      const result = EpubPlayerService.handlePlayerEvent(undefined);

      expect(result.type).toBe('unknown');
      expect(result.data).toBeUndefined();
    });

    it('should handle different event types', () => {
      const eventTypes = ['START', 'LOADED', 'ERROR', 'END', 'INTERACT'];

      eventTypes.forEach(type => {
        const mockEvent = { eid: type, data: {} };
        const result = EpubPlayerService.handlePlayerEvent(mockEvent);
        expect(result.type).toBe(type);
      });
    });

    it('should preserve all event data', () => {
      const mockEvent = {
        eid: 'INTERACT',
        ver: '1.0',
        edata: { type: 'CLICK', id: 'button-1' },
        metaData: { duration: 100 },
      };

      const result = EpubPlayerService.handlePlayerEvent(mockEvent);

      expect(result.data).toEqual(mockEvent);
      expect(result.data.ver).toBe('1.0');
      expect(result.data.edata).toEqual({ type: 'CLICK', id: 'button-1' });
      expect(result.data.metaData).toEqual({ duration: 100 });
    });
  });
});
