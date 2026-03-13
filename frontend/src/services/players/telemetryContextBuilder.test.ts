import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildTelemetryContext } from './telemetryContextBuilder';
import userAuthInfoService from '../userAuthInfoService/userAuthInfoService';
import appCoreService from '../AppCoreService';
import { OrganizationService } from '../OrganizationService';
import userProfileService from '../UserProfileService';

vi.mock('../userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getSessionId: vi.fn().mockReturnValue('test-session-id'),
    getUserId: vi.fn().mockReturnValue('test-user-id'),
  },
}));

vi.mock('../AppCoreService', () => ({
  default: {
    getDeviceId: vi.fn().mockResolvedValue('test-device-id'),
    getPData: vi.fn().mockResolvedValue({ id: 'test.portal', ver: '1.0', pid: 'test.portal' }),
  },
}));

vi.mock('../OrganizationService', () => ({
  OrganizationService: vi.fn().mockImplementation(() => ({
    search: vi.fn().mockResolvedValue({
      data: {
        result: {
          response: {
            content: [{ channel: 'test-channel', hashTagId: 'test-hash-tag' }],
          },
        },
        ts: '2026-03-13T10:00:00.000Z',
      },
    }),
  })),
}));

vi.mock('../UserProfileService', () => ({
  default: {
    getUserData: vi.fn().mockResolvedValue({ firstName: 'John', lastName: 'Doe' }),
  },
}));

describe('buildTelemetryContext', () => {
  let mockOrgSearch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    // Setup default org search mock
    mockOrgSearch = vi.fn().mockResolvedValue({
      data: {
        result: {
          response: {
            content: [{ channel: 'test-channel', hashTagId: 'test-hash-tag' }],
          },
        },
        ts: '2026-03-13T10:00:00.000Z',
      },
    });

    vi.mocked(OrganizationService).mockImplementation(function (this: any) {
      this.search = mockOrgSearch;
    } as any);

    // Reset default mocks
    vi.mocked(appCoreService.getDeviceId).mockResolvedValue('test-device-id');
    vi.mocked(appCoreService.getPData).mockResolvedValue({ id: 'test.portal', ver: '1.0', pid: 'test.portal' });
    vi.mocked(userProfileService.getUserData).mockResolvedValue({ firstName: 'John', lastName: 'Doe' });
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue('test-user-id');
    vi.mocked(userAuthInfoService.getSessionId).mockReturnValue('test-session-id');
  });

  it('should build context with all required fields', async () => {
    const context = await buildTelemetryContext();

    expect(context.sid).toBe('test-session-id');
    expect(context.uid).toBe('test-user-id');
    expect(context.did).toBe('test-device-id');
    expect(context.channel).toBe('test-channel');
    expect(context.pdata).toEqual({ id: 'test.portal', ver: '1.0', pid: 'test.portal' });
    expect(context.userData).toEqual({ firstName: 'John', lastName: 'Doe' });
    expect(context.timeDiff).toBe('2026-03-13T10:00:00.000Z');
    expect(context.endpoint).toBe('/portal/data/v1/telemetry');
    expect(context.host).toBe('');
  });

  it('should set tags and dims from hashTagId', async () => {
    const context = await buildTelemetryContext();

    expect(context.tags).toEqual(['test-hash-tag']);
    expect(context.dims).toEqual(['test-hash-tag']);
  });

  it('should set app from channel', async () => {
    const context = await buildTelemetryContext();

    expect(context.app).toEqual(['test-channel']);
  });

  it('should set partner to empty array', async () => {
    const context = await buildTelemetryContext();

    expect(context.partner).toEqual([]);
  });

  it('should default mode to play', async () => {
    const context = await buildTelemetryContext();

    expect(context.mode).toBe('play');
  });

  it('should override mode from contextProps', async () => {
    const context = await buildTelemetryContext({ mode: 'preview' });

    expect(context.mode).toBe('preview');
  });

  it('should use caller-provided cdata', async () => {
    const cdata = [{ id: 'course-1', type: 'course' }];
    const context = await buildTelemetryContext({ cdata });

    expect(context.cdata).toEqual(cdata);
  });

  it('should override contextRollup from contextProps', async () => {
    const contextRollup = { l1: 'custom', l2: 'nested' };
    const context = await buildTelemetryContext({ contextRollup });

    expect(context.contextRollup).toEqual(contextRollup);
  });

  it('should default contextRollup to { l1: channel }', async () => {
    const context = await buildTelemetryContext();

    expect(context.contextRollup).toEqual({ l1: 'test-channel' });
  });

  it('should override objectRollup from contextProps', async () => {
    const objectRollup = { l1: 'collection-1', l2: 'unit-1' };
    const context = await buildTelemetryContext({ objectRollup });

    expect(context.objectRollup).toEqual(objectRollup);
  });

  it('should set contentId from options', async () => {
    const context = await buildTelemetryContext(undefined, { contentId: 'do_123' });

    expect(context.contentId).toBe('do_123');
  });

  it('should not set contentId when not provided', async () => {
    const context = await buildTelemetryContext();

    expect(context.contentId).toBeUndefined();
  });

  it('should extract timeDiff from org search response data.ts', async () => {
    mockOrgSearch.mockResolvedValueOnce({
      data: {
        result: {
          response: {
            content: [{ channel: 'test-channel', hashTagId: 'test-hash-tag' }],
          },
        },
        ts: '2026-03-13T10:00:00.000Z',
      },
    });

    const context = await buildTelemetryContext();

    expect(context.timeDiff).toBe('2026-03-13T10:00:00.000Z');
  });

  it('should default timeDiff to 0 when data.ts is missing', async () => {
    mockOrgSearch.mockResolvedValueOnce({
      data: {
        result: {
          response: {
            content: [{ channel: 'test-channel', hashTagId: 'test-hash-tag' }],
          },
        },
      },
    });

    const context = await buildTelemetryContext();

    expect(context.timeDiff).toBe(0);
  });

  it('should throw error when org search fails', async () => {
    mockOrgSearch.mockRejectedValueOnce(new Error('network error'));

    await expect(buildTelemetryContext()).rejects.toThrow('Failed to fetch organization data: network error');
  });

  it('should fallback uid to anonymous when not available', async () => {
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);

    const context = await buildTelemetryContext();

    expect(context.uid).toBe('anonymous');
  });

  it('should throw error when getDeviceId fails', async () => {
    vi.mocked(appCoreService.getDeviceId).mockRejectedValueOnce(new Error('device error'));

    await expect(buildTelemetryContext()).rejects.toThrow('Failed to get device ID: device error');
  });

  it('should throw error when getUserData fails', async () => {
    vi.mocked(userProfileService.getUserData).mockRejectedValueOnce(new Error('user profile error'));

    await expect(buildTelemetryContext()).rejects.toThrow('Failed to fetch user profile data: user profile error');
  });

  it('should throw error when org search throws non-Error object', async () => {
    mockOrgSearch.mockRejectedValueOnce('string error');

    await expect(buildTelemetryContext()).rejects.toThrow('Failed to fetch organization data: string error');
  });
});
