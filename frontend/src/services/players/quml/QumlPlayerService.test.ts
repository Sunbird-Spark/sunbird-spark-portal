import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QumlPlayerService } from './QumlPlayerService';
import type { QumlPlayerMetadata } from './types';
import { buildTelemetryContext } from '../telemetryContextBuilder';

vi.mock('../telemetryContextBuilder', () => ({
  buildTelemetryContext: vi.fn().mockResolvedValue({
    mode: 'play',
    sid: 'session-123',
    did: 'device-123',
    uid: 'user-123',
    channel: 'org-channel',
    pdata: { id: 'sunbird.portal', ver: '3.2.12', pid: 'sunbird.portal.contentplayer' },
    contextRollup: { l1: 'org-channel' },
    tags: ['org-channel'],
    cdata: [],
    timeDiff: 0,
    objectRollup: {},
    host: '',
    endpoint: '/data/v3/telemetry',
    dims: ['org-channel'],
    app: ['org-channel'],
    partner: [],
    userData: { firstName: '', lastName: '' },
  }),
}));

const defaultContext = {
  mode: 'play',
  sid: 'session-123',
  did: 'device-123',
  uid: 'user-123',
  channel: 'org-channel',
  pdata: { id: 'sunbird.portal', ver: '3.2.12', pid: 'sunbird.portal.contentplayer' },
  contextRollup: { l1: 'org-channel' },
  tags: ['org-channel'],
  cdata: [],
  timeDiff: 0,
  objectRollup: {},
  host: '',
  endpoint: '/data/v3/telemetry',
  dims: ['org-channel'],
  app: ['org-channel'],
  partner: [],
  userData: { firstName: '', lastName: '' },
};

describe('QumlPlayerService', () => {
  let service: QumlPlayerService;

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

    (buildTelemetryContext as any).mockImplementation(async (contextProps?: any, options?: any) => ({
      ...defaultContext,
      mode: contextProps?.mode || 'play',
      cdata: contextProps?.cdata || [],
      contextRollup: contextProps?.contextRollup || { l1: 'org-channel' },
      objectRollup: contextProps?.objectRollup || {},
      contentId: options?.contentId,
    }));

    service = new QumlPlayerService();
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

    it('should call buildTelemetryContext with correct arguments', async () => {
      await service.createConfig(mockMetadata);

      expect(buildTelemetryContext).toHaveBeenCalledWith(undefined, { contentId: 'do_123' });
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

    it('should initialize config as empty object', async () => {
      const config = await service.createConfig(mockMetadata);

      expect(config.config).toEqual({});
    });
  });

  describe('createElement', () => {
    it('should create sunbird-quml-player element with config', () => {
      const config = {
        context: { sid: 'test' } as any,
        config: {},
        metadata: mockMetadata,
        data: {},
      };

      const element = service.createElement(config);

      expect(element.tagName.toLowerCase()).toBe('sunbird-quml-player');
      expect(element.getAttribute('data-player-id')).toBe('do_123');
    });

    it('should set questionListUrl on window', () => {
      const config = {
        context: { sid: 'test' } as any,
        config: {},
        metadata: mockMetadata,
        data: {},
      };
      service.createElement(config);
      expect((window as any).questionListUrl).toBe('/action/question/v2/list');
    });

    it('should append styles link on first createElement call', () => {
      (QumlPlayerService as any).stylesLoaded = false;
      document.querySelectorAll('[data-quml-player-styles]').forEach(el => el.remove());

      const config = {
        context: { sid: 'test' } as any,
        config: {},
        metadata: mockMetadata,
        data: {},
      };
      service.createElement(config);

      const link = document.querySelector('[data-quml-player-styles]');
      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe('/assets/quml-player/styles.css');
    });

    it('should not append duplicate styles link on second call', () => {
      (QumlPlayerService as any).stylesLoaded = false;
      document.querySelectorAll('[data-quml-player-styles]').forEach(el => el.remove());

      const config = {
        context: { sid: 'test' } as any,
        config: {},
        metadata: mockMetadata,
        data: {},
      };
      service.createElement(config);
      service.createElement(config);

      const links = document.querySelectorAll('[data-quml-player-styles]');
      expect(links.length).toBe(1);
    });
  });

  describe('unloadStyles', () => {
    it('should remove style link from DOM', () => {
      // Clean up any links left from previous tests first
      document.querySelectorAll('[data-quml-player-styles]').forEach(el => el.remove());
      (QumlPlayerService as any).stylesLoaded = false;

      const link = document.createElement('link');
      link.setAttribute('data-quml-player-styles', 'true');
      document.head.appendChild(link);

      QumlPlayerService.unloadStyles();

      expect(document.querySelector('[data-quml-player-styles]')).toBeNull();
    });

    it('should reset stylesLoaded flag', () => {
      (QumlPlayerService as any).stylesLoaded = true;
      QumlPlayerService.unloadStyles();
      expect((QumlPlayerService as any).stylesLoaded).toBe(false);
    });

    it('should not throw when no styles link exists', () => {
      document.querySelectorAll('[data-quml-player-styles]').forEach(el => el.remove());
      (QumlPlayerService as any).stylesLoaded = false;
      expect(() => QumlPlayerService.unloadStyles()).not.toThrow();
    });
  });

  describe('attachEventListeners', () => {
    it('should attach playerEvent listener and fire callback', () => {
      const config = {
        context: { sid: 'test' } as any,
        config: {},
        metadata: mockMetadata,
        data: {},
      };
      const element = service.createElement(config);
      const callback = vi.fn();

      service.attachEventListeners(element, callback);

      element.dispatchEvent(new CustomEvent('playerEvent', { detail: { eid: 'START' } }));

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0]?.[0].type).toBe('START');
    });

    it('should attach telemetryEvent listener and fire callback', () => {
      const config = {
        context: { sid: 'test' } as any,
        config: {},
        metadata: mockMetadata,
        data: {},
      };
      const element = service.createElement(config);
      const telemetryCallback = vi.fn();

      service.attachEventListeners(element, undefined, telemetryCallback);

      element.dispatchEvent(new CustomEvent('telemetryEvent', { detail: { event: 'IMPRESSION' } }));

      expect(telemetryCallback).toHaveBeenCalledWith({ event: 'IMPRESSION' });
    });

    it('should use "unknown" type when event has no eid', () => {
      const config = {
        context: { sid: 'test' } as any,
        config: {},
        metadata: mockMetadata,
        data: {},
      };
      const element = service.createElement(config);
      const callback = vi.fn();

      service.attachEventListeners(element, callback);
      element.dispatchEvent(new CustomEvent('playerEvent', { detail: {} }));

      expect(callback.mock.calls[0]?.[0].type).toBe('unknown');
    });

    it('should be idempotent — multiple calls do not duplicate listeners', () => {
      const config = {
        context: { sid: 'test' } as any,
        config: {},
        metadata: mockMetadata,
        data: {},
      };
      const element = service.createElement(config);
      const callback = vi.fn();

      service.attachEventListeners(element, callback);
      service.attachEventListeners(element, callback);
      service.attachEventListeners(element, callback);

      element.dispatchEvent(new CustomEvent('playerEvent', { detail: { eid: 'START' } }));

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeEventListeners', () => {
    it('should prevent callbacks from firing after removal', () => {
      const config = {
        context: { sid: 'test' } as any,
        config: {},
        metadata: mockMetadata,
        data: {},
      };
      const element = service.createElement(config);
      const callback = vi.fn();

      service.attachEventListeners(element, callback);
      service.removeEventListeners(element);

      element.dispatchEvent(new CustomEvent('playerEvent', { detail: { eid: 'START' } }));

      expect(callback).not.toHaveBeenCalled();
    });

    it('should not throw when called on element without listeners', () => {
      const element = document.createElement('div');
      expect(() => service.removeEventListeners(element)).not.toThrow();
    });
  });
});
