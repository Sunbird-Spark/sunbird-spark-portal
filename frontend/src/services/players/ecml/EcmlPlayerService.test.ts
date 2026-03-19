import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EcmlPlayerService } from './EcmlPlayerService';
import type { EcmlPlayerMetadata } from './types';
import { buildTelemetryContext } from '../telemetryContextBuilder';

vi.mock('../telemetryContextBuilder', () => ({
  buildTelemetryContext: vi.fn().mockResolvedValue({
    mode: 'play',
    sid: 'test-session-id',
    did: 'test-device-id',
    uid: 'test-user-id',
    channel: 'test-channel',
    pdata: { id: 'test.portal', ver: '1.0.0', pid: 'test.portal' },
    contextRollup: { l1: 'test-channel' },
    tags: ['test-channel'],
    cdata: [],
    timeDiff: 0,
    objectRollup: {},
    host: '',
    endpoint: '/data/v3/telemetry',
    dims: ['test-channel'],
    app: ['test-channel'],
    partner: [],
    userData: { firstName: '', lastName: '' },
  }),
}));

const defaultContext = {
  mode: 'play',
  sid: 'test-session-id',
  did: 'test-device-id',
  uid: 'test-user-id',
  channel: 'test-channel',
  pdata: { id: 'test.portal', ver: '1.0.0', pid: 'test.portal' },
  contextRollup: { l1: 'test-channel' },
  tags: ['test-channel'],
  cdata: [],
  timeDiff: 0,
  objectRollup: {},
  host: '',
  endpoint: '/data/v3/telemetry',
  dims: ['test-channel'],
  app: ['test-channel'],
  partner: [],
  userData: { firstName: '', lastName: '' },
};

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

    (buildTelemetryContext as any).mockImplementation(async (contextProps?: any, options?: any) => ({
      ...defaultContext,
      mode: contextProps?.mode || 'play',
      cdata: contextProps?.cdata || [],
      contextRollup: contextProps?.contextRollup || { l1: 'test-channel' },
      objectRollup: contextProps?.objectRollup || {},
      contentId: options?.contentId,
    }));

    service = new EcmlPlayerService();
  });

  describe('createConfig', () => {
    it('should create config with all required fields from services', async () => {
      const result = await service.createConfig(mockMetadata);

      expect(result.context.sid).toBe('test-session-id');
      expect(result.context.uid).toBe('test-user-id');
      expect(result.context.did).toBe('test-device-id');
      expect(result.context.channel).toBe('test-channel');
      expect(result.context.contentId).toBe('do_content_123');
      expect(result.metadata).toEqual(mockMetadata);
    });

    it('should call buildTelemetryContext with contentId', async () => {
      await service.createConfig(mockMetadata);

      expect(buildTelemetryContext).toHaveBeenCalledWith(undefined, { contentId: 'do_content_123' });
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
      expect(result.context.endpoint).toBe('/data/v3/telemetry');
    });
  });

  describe('buildPlayerUrl', () => {
    it('should return the preview URL', () => {
      expect(service.buildPlayerUrl()).toBe('/content/preview/preview.html?webview=true');
    });
  });

  // ── Anonymous vs Logged-In telemetry context ──────────────────────────────

  describe('Telemetry context — anonymous user', () => {
    const anonymousContext = {
      ...defaultContext,
      uid: 'anonymous',
      // For anonymous users: tags/dims/contextRollup come from org hashTagId
      tags: ['org-hash-tag-001'],
      dims: ['org-hash-tag-001'],
      contextRollup: { l1: 'org-hash-tag-001' },
      // userData is empty for anonymous users
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
      const result = await service.createConfig(mockMetadata);
      expect(result.context.uid).toBe('anonymous');
    });

    it('does NOT include personal userData for anonymous user', async () => {
      const result = await service.createConfig(mockMetadata);
      expect(result.context.userData).toEqual({ firstName: '', lastName: '' });
    });

    it('uses org hashTagId as tags and contextRollup for anonymous user', async () => {
      const result = await service.createConfig(mockMetadata);
      expect(result.context.tags).toEqual(['org-hash-tag-001']);
      expect(result.context.contextRollup).toEqual({ l1: 'org-hash-tag-001' });
    });

    it('still sets contentId, mode and endpoint correctly', async () => {
      const result = await service.createConfig(mockMetadata);
      expect(result.context.contentId).toBe('do_content_123');
      expect(result.context.mode).toBe('play');
      expect(result.context.endpoint).toBe('/data/v3/telemetry');
    });

    it('uses preview mode when explicitly set', async () => {
      const result = await service.createConfig(mockMetadata, { mode: 'preview' });
      expect(result.context.mode).toBe('preview');
    });
  });

  describe('Telemetry context — logged-in user', () => {
    const loggedInContext = {
      ...defaultContext,
      uid: 'real-user-456',
      // For logged-in users: tags come from user org profile
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
      const result = await service.createConfig(mockMetadata);
      expect(result.context.uid).toBe('real-user-456');
    });

    it('includes user profile userData', async () => {
      const result = await service.createConfig(mockMetadata);
      expect(result.context.userData).toEqual({ firstName: 'Alice', lastName: 'Bob' });
    });

    it('uses user org-derived tags and contextRollup', async () => {
      const result = await service.createConfig(mockMetadata);
      expect(result.context.tags).toEqual(['org-hash-1', 'org-hash-2']);
      expect(result.context.contextRollup).toEqual({ l1: '0126796199493140480' });
    });

    it('appends courseId and batchId to dims when cdata contains course/batch entries', async () => {
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

      const result = await service.createConfig(mockMetadata, {
        cdata: [
          { id: 'course-123', type: 'course' },
          { id: 'batch-456', type: 'batch' },
        ],
      });

      expect(result.context.dims).toEqual(['org-hash-1', 'org-hash-2', 'course-123', 'batch-456']);
    });
  });
});
