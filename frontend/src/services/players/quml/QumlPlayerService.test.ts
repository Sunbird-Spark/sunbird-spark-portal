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
  });
});
