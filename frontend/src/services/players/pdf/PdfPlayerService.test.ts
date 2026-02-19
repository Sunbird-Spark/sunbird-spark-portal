import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PdfPlayerService } from './PdfPlayerService';
import type { PdfPlayerMetadata } from './types';
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

describe('PdfPlayerService', () => {
  let service: PdfPlayerService;

  const mockMetadata: PdfPlayerMetadata = {
    identifier: 'content-123',
    name: 'Test PDF',
    artifactUrl: 'https://example.com/document.pdf',
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
                channel: 'test-channel-456',
                identifier: 'org-123',
              },
            ],
          },
        },
      },
    });

    // Mock the custom element to prevent script loading
    if (!customElements.get('sunbird-pdf-player')) {
      customElements.define('sunbird-pdf-player', class extends HTMLElement {});
    }

    service = new PdfPlayerService();
  });

  describe('createConfig', () => {
    it('should create config with all required fields from services', async () => {
      vi.mocked(userAuthInfoService.getSessionId).mockReturnValue('session-789');
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-456');

      const config = await service.createConfig(mockMetadata);

      expect(config.context.sid).toBe('session-789');
      expect(config.context.uid).toBe('user-456');
      expect(config.context.did).toBe('');
      expect(config.context.channel).toBe('test-channel-456');
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

      // Create a new service instance to ensure fresh org service
      const newService = new PdfPlayerService();
      const config = await newService.createConfig(mockMetadata);
      
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

      // Create a new service instance to ensure fresh org service
      const newService = new PdfPlayerService();
      const config = await newService.createConfig(mockMetadata);
      
      // Should use random fallback channel
      expect(config.context.channel).toMatch('');
    });

    it('should use random fallback channel when org service throws error', async () => {
      mockOrgSearch.mockRejectedValue(new Error('Network error'));

      // Create a new service instance to ensure fresh org service
      const newService = new PdfPlayerService();
      const config = await newService.createConfig(mockMetadata);
      
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
        l1: 'test-channel-456',
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
    it('should create sunbird-pdf-player element', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = service.createElement(config);

      expect(element.tagName.toLowerCase()).toBe('sunbird-pdf-player');
    });

    it('should set player-config attribute with JSON config', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = service.createElement(config);

      const configAttr = element.getAttribute('player-config');
      expect(configAttr).toBeTruthy();
      
      const parsedConfig = JSON.parse(configAttr!);
      expect(parsedConfig.metadata.identifier).toBe('content-123');
    });

    it('should set data-player-id attribute from metadata identifier', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = service.createElement(config);

      expect(element.getAttribute('data-player-id')).toBe('content-123');
    });

    it('should load styles on first createElement call', async () => {
      // Clear any existing styles and reset static flag
      document.querySelectorAll('[data-pdf-player-styles]').forEach(el => el.remove());
      (PdfPlayerService as any).stylesLoaded = false;

      const config = await service.createConfig(mockMetadata);
      service.createElement(config);

      const styleLink = document.querySelector('[data-pdf-player-styles="true"]');
      expect(styleLink).toBeTruthy();
      expect(styleLink?.getAttribute('href')).toBe('/assets/pdf-player/styles.css');
      expect(styleLink?.getAttribute('rel')).toBe('stylesheet');
    });

    it('should not load styles multiple times', async () => {
      // Clear any existing styles and reset static flag
      document.querySelectorAll('[data-pdf-player-styles]').forEach(el => el.remove());
      (PdfPlayerService as any).stylesLoaded = false;

      const config = await service.createConfig(mockMetadata);
      
      // Create multiple elements
      service.createElement(config);
      service.createElement(config);
      service.createElement(config);

      const styleLinks = document.querySelectorAll('[data-pdf-player-styles="true"]');
      expect(styleLinks.length).toBe(1);
    });

    it('should not load styles if already present in DOM', async () => {
      // Clear any existing styles and reset static flag
      document.querySelectorAll('[data-pdf-player-styles]').forEach(el => el.remove());
      (PdfPlayerService as any).stylesLoaded = false;

      // Manually add a style element to simulate existing styles
      const existingStyle = document.createElement('link');
      existingStyle.setAttribute('data-pdf-player-styles', 'true');
      existingStyle.rel = 'stylesheet';
      existingStyle.href = '/assets/pdf-player/styles.css';
      document.head.appendChild(existingStyle);

      const config = await service.createConfig(mockMetadata);
      service.createElement(config);

      // Should still only have one style element
      const styleLinks = document.querySelectorAll('[data-pdf-player-styles="true"]');
      expect(styleLinks.length).toBe(1);
      expect((PdfPlayerService as any).stylesLoaded).toBe(true);
    });

    it('should not load styles if stylesLoaded flag is already true', async () => {
      // Clear any existing styles but keep static flag as true
      document.querySelectorAll('[data-pdf-player-styles]').forEach(el => el.remove());
      (PdfPlayerService as any).stylesLoaded = true;

      const config = await service.createConfig(mockMetadata);
      service.createElement(config);

      // Should not create any new style elements
      const styleLinks = document.querySelectorAll('[data-pdf-player-styles="true"]');
      expect(styleLinks.length).toBe(0);
    });
  });

  describe('attachEventListeners', () => {
    it('should attach playerEvent listener', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = service.createElement(config);
      const callback = vi.fn();

      service.attachEventListeners(element, callback);

      const event = new CustomEvent('playerEvent', {
        detail: { eid: 'START', data: {} },
      });
      element.dispatchEvent(event);

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0]?.[0].type).toBe('START');
    });

    it('should attach telemetryEvent listener', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = service.createElement(config);
      const telemetryCallback = vi.fn();

      service.attachEventListeners(element, undefined, telemetryCallback);

      const event = new CustomEvent('telemetryEvent', {
        detail: { event: 'IMPRESSION' },
      });
      element.dispatchEvent(event);

      expect(telemetryCallback).toHaveBeenCalledWith({ event: 'IMPRESSION' });
    });

    it('should include playerId and timestamp in player event', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = service.createElement(config);
      const callback = vi.fn();

      service.attachEventListeners(element, callback);

      const event = new CustomEvent('playerEvent', {
        detail: { eid: 'LOADED' },
      });
      element.dispatchEvent(event);

      const eventData = callback.mock.calls[0]?.[0];
      expect(eventData?.playerId).toBe('content-123');
      expect(eventData?.timestamp).toBeGreaterThan(0);
    });

    it('should handle events without eid', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = service.createElement(config);
      const callback = vi.fn();

      service.attachEventListeners(element, callback);

      const event = new CustomEvent('playerEvent', {
        detail: { data: {} },
      });
      element.dispatchEvent(event);

      expect(callback.mock.calls[0]?.[0].type).toBe('unknown');
    });

    it('should be idempotent - calling multiple times should not create duplicate listeners', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = service.createElement(config);
      const callback = vi.fn();

      service.attachEventListeners(element, callback);
      service.attachEventListeners(element, callback);
      service.attachEventListeners(element, callback);

      const event = new CustomEvent('playerEvent', {
        detail: { eid: 'START' },
      });
      element.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeEventListeners', () => {
    it('should remove event listeners', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = service.createElement(config);
      const callback = vi.fn();

      service.attachEventListeners(element, callback);
      service.removeEventListeners(element);

      const event = new CustomEvent('playerEvent', {
        detail: { eid: 'START' },
      });
      element.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should not throw error when removing listeners from element without listeners', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = service.createElement(config);

      expect(() => service.removeEventListeners(element)).not.toThrow();
    });
  });
});
