import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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

  describe('CSS injection and rewriting', () => {
    it('should inject scoped style element when CSS is non-empty', async () => {
      const mockCss = ':root { --color: red; } html { font-size: 16px; } body { margin: 0; }';
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockCss),
      }));

      (EpubPlayerService as any).cachedCss = null;
      (EpubPlayerService as any).cssLoading = undefined;

      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);

      const styleEl = element.querySelector('style[data-epub-player-styles]');
      expect(styleEl).not.toBeNull();
      expect(styleEl?.textContent).toContain('@scope');
    });

    it('should rewrite :root to :scope in injected CSS', async () => {
      const mockCss = ':root { --primary: blue; }';
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockCss),
      }));

      (EpubPlayerService as any).cachedCss = null;
      (EpubPlayerService as any).cssLoading = undefined;

      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);

      const styleEl = element.querySelector('style[data-epub-player-styles]');
      expect(styleEl?.textContent).toContain(':scope');
      expect(styleEl?.textContent).not.toContain(':root');
    });

    it('should rewrite html and body selectors to :scope', async () => {
      const mockCss = 'html { font-size: 16px; } body { margin: 0; }';
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockCss),
      }));

      (EpubPlayerService as any).cachedCss = null;
      (EpubPlayerService as any).cssLoading = undefined;

      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);

      const styleEl = element.querySelector('style[data-epub-player-styles]');
      expect(styleEl?.textContent).not.toContain('html {');
      expect(styleEl?.textContent).not.toContain('body {');
    });

    it('should not inject style element when CSS is empty', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(''),
      }));

      (EpubPlayerService as any).cachedCss = null;

      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);

      const styleEl = element.querySelector('style[data-epub-player-styles]');
      expect(styleEl).toBeNull();
    });

    it('should fall back to empty CSS when fetch response is not ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve(''),
      }));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      (EpubPlayerService as any).cachedCss = null;
      (EpubPlayerService as any).cssLoading = undefined;

      const config = await service.createConfig(mockMetadata);
      const element = await service.createElement(config);

      expect(element).toBeTruthy();
    });

    it('should return cached CSS on second createElement call', async () => {
      const mockCss = 'body { margin: 0; }';
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockCss),
      });
      vi.stubGlobal('fetch', mockFetch);

      (EpubPlayerService as any).cachedCss = null;
      (EpubPlayerService as any).cssLoading = undefined;

      const config = await service.createConfig(mockMetadata);
      await service.createElement(config);
      await service.createElement(config);

      // fetch should only be called once (cached after first call)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should reuse in-flight CSS promise for concurrent calls', async () => {
      let resolveFetch!: (value: string) => void;
      const fetchPromise = new Promise<string>(resolve => { resolveFetch = resolve; });
      const mockFetch = vi.fn().mockReturnValue(
        Promise.resolve({ ok: true, text: () => fetchPromise })
      );
      vi.stubGlobal('fetch', mockFetch);

      (EpubPlayerService as any).cachedCss = null;
      (EpubPlayerService as any).cssLoading = undefined;

      const config = await service.createConfig(mockMetadata);

      // Start two createElement calls concurrently — both should share the same fetch
      const p1 = service.createElement(config);
      const p2 = service.createElement(config);

      resolveFetch('body { margin: 0; }');
      await Promise.all([p1, p2]);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('unloadStyles', () => {
    it('should be callable without throwing', () => {
      expect(() => EpubPlayerService.unloadStyles()).not.toThrow();
    });
  });

  describe('getPlayerElement — || element fallback (line 159)', () => {
    it('falls back to wrapper element when sunbird-epub-player child is absent', async () => {
      const plainDiv = document.createElement('div');
      const callback = vi.fn();

      // attachEventListeners calls getPlayerElement internally
      // When querySelector returns null, it uses `element` itself as the playerEl
      service.attachEventListeners(plainDiv, callback);

      const event = new CustomEvent('playerEvent', {
        detail: { eid: 'START' },
      });
      plainDiv.dispatchEvent(event);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0]?.[0].type).toBe('START');
    });

    it('uses "epub-player" when playerEl has no data-player-id (line 181 || branch)', async () => {
      const plainDiv = document.createElement('div');
      const callback = vi.fn();

      service.attachEventListeners(plainDiv, callback);

      const event = new CustomEvent('playerEvent', {
        detail: { eid: 'START' },
      });
      plainDiv.dispatchEvent(event);

      expect(callback.mock.calls[0]?.[0].playerId).toBe('epub-player');
    });
  });
});

