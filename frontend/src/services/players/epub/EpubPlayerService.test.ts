import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EpubPlayerService } from './EpubPlayerService';
import type { EpubPlayerMetadata } from './types';
import { buildTelemetryContext } from '../telemetryContextBuilder';

vi.mock('../telemetryContextBuilder', () => ({
  buildTelemetryContext: vi.fn().mockResolvedValue({
    mode: 'play',
    sid: 'test-session-id',
    did: 'test-device-id',
    uid: 'test-user-id',
    channel: 'test-channel-456',
    pdata: { id: 'sunbird.portal', ver: '1.0.0', pid: 'sunbird.portal' },
    contextRollup: { l1: 'test-channel-456' },
    tags: ['test-channel-456'],
    cdata: [],
    timeDiff: 0,
    objectRollup: {},
    host: '',
    endpoint: '/data/v3/telemetry',
    dims: ['test-channel-456'],
    app: ['test-channel-456'],
    partner: [],
    userData: { firstName: '', lastName: '' },
  }),
}));

const defaultContext = {
  mode: 'play',
  sid: 'test-session-id',
  did: 'test-device-id',
  uid: 'test-user-id',
  channel: 'test-channel-456',
  pdata: { id: 'sunbird.portal', ver: '1.0.0', pid: 'sunbird.portal' },
  contextRollup: { l1: 'test-channel-456' },
  tags: ['test-channel-456'],
  cdata: [],
  timeDiff: 0,
  objectRollup: {},
  host: '',
  endpoint: '/data/v3/telemetry',
  dims: ['test-channel-456'],
  app: ['test-channel-456'],
  partner: [],
  userData: { firstName: '', lastName: '' },
};

describe('EpubPlayerService', () => {
  let service: EpubPlayerService;

  const mockMetadata: EpubPlayerMetadata = {
    identifier: 'content-123',
    name: 'Test EPUB',
    artifactUrl: 'https://example.com/book.epub',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset static caches so each test starts fresh
    (EpubPlayerService as any).scriptLoaded = false;
    (EpubPlayerService as any).scriptLoading = undefined;
    (EpubPlayerService as any).cachedCss = null;
    (EpubPlayerService as any).cssLoading = undefined;

    // Prevent fetchStyles() from hanging — return empty CSS immediately
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(''),
    }));

    (buildTelemetryContext as any).mockImplementation(async (contextProps?: any, options?: any) => ({
      ...defaultContext,
      mode: contextProps?.mode || 'play',
      cdata: contextProps?.cdata || [],
      contextRollup: contextProps?.contextRollup || { l1: 'test-channel-456' },
      objectRollup: contextProps?.objectRollup || {},
      contentId: options?.contentId,
    }));

    // Mock the custom element to prevent script loading
    if (!customElements.get('sunbird-epub-player')) {
      customElements.define('sunbird-epub-player', class extends HTMLElement {});
    }

    service = new EpubPlayerService();
  });

  describe('createConfig', () => {
    it('should create config with all required fields from services', async () => {
      const config = await service.createConfig(mockMetadata);

      expect(config.context.sid).toBe('test-session-id');
      expect(config.context.uid).toBe('test-user-id');
      expect(config.context.did).toBe('test-device-id');
      expect(config.context.channel).toBe('test-channel-456');
      expect(config.metadata).toEqual(mockMetadata);
    });

    it('should call buildTelemetryContext with correct arguments', async () => {
      await service.createConfig(mockMetadata);

      expect(buildTelemetryContext).toHaveBeenCalledWith(undefined, { contentId: 'content-123' });
    });

    it('should call buildTelemetryContext with contextProps when provided', async () => {
      const contextProps = { mode: 'preview' };
      await service.createConfig(mockMetadata, contextProps);

      expect(buildTelemetryContext).toHaveBeenCalledWith(contextProps, { contentId: 'content-123' });
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

    it('should use default contextRollup when not provided', async () => {
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

    it('should set pdata from context', async () => {
      const config = await service.createConfig(mockMetadata);

      expect(config.context.pdata).toEqual({
        id: 'sunbird.portal',
        ver: '1.0.0',
        pid: 'sunbird.portal',
      });
    });

    it('should set default values for timeDiff, host, and endpoint', async () => {
      const config = await service.createConfig(mockMetadata);

      expect(config.context.timeDiff).toBe(0);
      expect(config.context.host).toBe('');
      expect(config.context.endpoint).toBe('/data/v3/telemetry');
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
  });

  describe('createElement', () => {
    it('should create sunbird-epub-player element', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);

      const playerEl = element.querySelector('sunbird-epub-player');
      expect(playerEl?.tagName.toLowerCase()).toBe('sunbird-epub-player');
    });

    it('should set player-config attribute with JSON config', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);

      const playerEl = element.querySelector('sunbird-epub-player');
      const configAttr = playerEl?.getAttribute('player-config');
      expect(configAttr).toBeTruthy();

      const parsedConfig = JSON.parse(configAttr!);
      expect(parsedConfig.metadata.identifier).toBe('content-123');
    });

    it('should set data-player-id attribute from metadata identifier', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);

      const playerEl = element.querySelector('sunbird-epub-player');
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
      const playerEl = element.querySelector('sunbird-epub-player');
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
      const playerEl = element.querySelector('sunbird-epub-player');
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
      const playerEl = element.querySelector('sunbird-epub-player');
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
      const playerEl = element.querySelector('sunbird-epub-player');
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
      const playerEl = element.querySelector('sunbird-epub-player');
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
      const playerEl = element.querySelector('sunbird-epub-player');
      playerEl?.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should not throw error when removing listeners from element without listeners', async () => {
      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);

      expect(() => service.removeEventListeners(element)).not.toThrow();
    });
  });

  // ── Anonymous vs Logged-In telemetry context ──────────────────────────────

  describe('Telemetry context — anonymous user', () => {
    const anonymousContext = {
      ...defaultContext,
      uid: 'anonymous',
      tags: ['org-hash-tag-001'],
      dims: ['org-hash-tag-001'],
      contextRollup: { l1: 'org-hash-tag-001' },
      userData: { firstName: '', lastName: '' },
    };

    beforeEach(() => {
      (buildTelemetryContext as any).mockImplementation(async (contextProps?: any, options?: any) => ({
        ...anonymousContext,
        mode: contextProps?.mode || 'play',
        cdata: contextProps?.cdata || [],
        contextRollup: contextProps?.contextRollup || { l1: 'org-hash-tag-001' },
        objectRollup: contextProps?.objectRollup || {},
        contentId: options?.contentId,
      }));
    });

    it('uses uid="anonymous" in the telemetry context', async () => {
      const config = await service.createConfig(mockMetadata);
      expect(config.context.uid).toBe('anonymous');
    });

    it('does NOT include personal userData for anonymous user', async () => {
      const config = await service.createConfig(mockMetadata);
      expect(config.context.userData).toEqual({ firstName: '', lastName: '' });
    });

    it('uses org hashTagId for tags and contextRollup', async () => {
      const config = await service.createConfig(mockMetadata);
      expect(config.context.tags).toEqual(['org-hash-tag-001']);
      expect(config.context.contextRollup).toEqual({ l1: 'org-hash-tag-001' });
    });

    it('still sets contentId, mode, and endpoint correctly', async () => {
      const config = await service.createConfig(mockMetadata);
      expect(config.context.contentId).toBe('content-123');
      expect(config.context.mode).toBe('play');
      expect(config.context.endpoint).toBe('/data/v3/telemetry');
    });

    it('supports preview mode for anonymous user', async () => {
      const config = await service.createConfig(mockMetadata, { mode: 'preview' });
      expect(config.context.mode).toBe('preview');
    });
  });

  describe('Telemetry context — logged-in user', () => {
    const loggedInContext = {
      ...defaultContext,
      uid: 'real-user-456',
      tags: ['org-hash-1', 'org-hash-2'],
      dims: ['org-hash-1', 'org-hash-2'],
      contextRollup: { l1: '0126796199493140480' },
      userData: { firstName: 'Alice', lastName: 'Bob' },
    };

    beforeEach(() => {
      (buildTelemetryContext as any).mockImplementation(async (contextProps?: any, options?: any) => ({
        ...loggedInContext,
        mode: contextProps?.mode || 'play',
        cdata: contextProps?.cdata || [],
        contextRollup: contextProps?.contextRollup || { l1: '0126796199493140480' },
        objectRollup: contextProps?.objectRollup || {},
        contentId: options?.contentId,
      }));
    });

    it('uses the real userId in the telemetry context', async () => {
      const config = await service.createConfig(mockMetadata);
      expect(config.context.uid).toBe('real-user-456');
    });

    it('includes full user profile userData', async () => {
      const config = await service.createConfig(mockMetadata);
      expect(config.context.userData).toEqual({ firstName: 'Alice', lastName: 'Bob' });
    });

    it('uses user org-derived tags and contextRollup', async () => {
      const config = await service.createConfig(mockMetadata);
      expect(config.context.tags).toEqual(['org-hash-1', 'org-hash-2']);
      expect(config.context.contextRollup).toEqual({ l1: '0126796199493140480' });
    });

    it('appends courseId and batchId to dims when cdata contains course/batch', async () => {
      (buildTelemetryContext as any).mockImplementation(async (contextProps?: any, options?: any) => ({
        ...loggedInContext,
        cdata: contextProps?.cdata || [],
        dims: [
          ...loggedInContext.tags,
          ...(contextProps?.cdata?.filter((c: any) => c.type === 'course').map((c: any) => c.id) || []),
          ...(contextProps?.cdata?.filter((c: any) => c.type === 'batch').map((c: any) => c.id) || []),
        ],
        contentId: options?.contentId,
      }));

      const config = await service.createConfig(mockMetadata, {
        cdata: [
          { id: 'course-123', type: 'course' },
          { id: 'batch-456', type: 'batch' },
        ],
      });

      expect(config.context.dims).toEqual(['org-hash-1', 'org-hash-2', 'course-123', 'batch-456']);
    });
  });
});
