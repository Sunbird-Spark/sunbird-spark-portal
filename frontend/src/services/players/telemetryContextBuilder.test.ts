import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildTelemetryContext } from './telemetryContextBuilder';
import userAuthInfoService from '../userAuthInfoService/userAuthInfoService';
import appCoreService from '../AppCoreService';
import { OrganizationService } from '../OrganizationService';
import userProfileService from '../UserProfileService';
import { SystemSettingService } from '../SystemSettingService';

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
        response: {
          content: [{ channel: 'test-channel', hashTagId: 'test-hash-tag' }],
        },
      },
      headers: { date: new Date().toUTCString() },
    }),
  })),
}));

vi.mock('../UserProfileService', () => ({
  default: {
    getUserData: vi.fn().mockResolvedValue({ firstName: 'John', lastName: 'Doe' }),
    getHashTagIds: vi.fn().mockResolvedValue(['0126796199493140480']),
    getOrganisationHashTagIds: vi.fn().mockResolvedValue(['org-hash-1', 'org-hash-2']),
  },
}));

vi.mock('../SystemSettingService', () => ({
  SystemSettingService: vi.fn().mockImplementation(function() {
    return {
      read: vi.fn().mockResolvedValue({
        data: { response: { value: 'sunbird' } },
      }),
    };
  }),
}));

describe('buildTelemetryContext', () => {
  let mockOrgSearch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    // Setup default org search mock with Date header for timeDiff computation
    mockOrgSearch = vi.fn().mockResolvedValue({
      data: {
        response: {
          content: [{ channel: 'test-channel', hashTagId: 'test-hash-tag' }],
        },
      },
      headers: { date: new Date().toUTCString() },
    });

    vi.mocked(OrganizationService).mockImplementation(function (this: any) {
      this.search = mockOrgSearch;
    } as any);

    // Reset default mocks
    vi.mocked(appCoreService.getDeviceId).mockResolvedValue('test-device-id');
    vi.mocked(appCoreService.getPData).mockResolvedValue({ id: 'test.portal', ver: '1.0', pid: 'test.portal' });
    vi.mocked(userProfileService.getUserData).mockResolvedValue({ firstName: 'John', lastName: 'Doe' });
    vi.mocked(userProfileService.getHashTagIds).mockResolvedValue(['0126796199493140480']);
    vi.mocked(userProfileService.getOrganisationHashTagIds).mockResolvedValue(['org-hash-1', 'org-hash-2']);
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
    expect(typeof context.timeDiff).toBe('number');
    expect(context.endpoint).toBe('/data/v3/telemetry');
    expect(context.host).toBe('');
  });

  it('should set tags and dims from user profile organisations for logged-in users', async () => {
    const context = await buildTelemetryContext();

    expect(context.tags).toEqual(['org-hash-1', 'org-hash-2']);
    expect(context.dims).toEqual(['org-hash-1', 'org-hash-2']);
  });

  it('should fallback tags to org hashTagId for anonymous users', async () => {
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);

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

  it('should default contextRollup from user hashTagIds', async () => {
    const context = await buildTelemetryContext();

    expect(context.contextRollup).toEqual({ l1: '0126796199493140480' });
  });

  it('should use empty contextRollup when hashTagIds is empty', async () => {
    vi.mocked(userProfileService.getHashTagIds).mockResolvedValueOnce([]);

    const context = await buildTelemetryContext();

    expect(context.contextRollup).toEqual({});
  });

  it('should set contextRollup from org hashTagId for anonymous users', async () => {
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);

    const context = await buildTelemetryContext();

    expect(context.contextRollup).toEqual({ l1: 'test-hash-tag' });
    expect(userProfileService.getUserData).not.toHaveBeenCalled();
    expect(userProfileService.getHashTagIds).not.toHaveBeenCalled();
    expect(userProfileService.getOrganisationHashTagIds).not.toHaveBeenCalled();
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

  it('should compute timeDiff as clock skew from response Date header', async () => {
    // Server date 5 seconds ahead of client
    const serverDate = new Date(Date.now() + 5000).toUTCString();
    mockOrgSearch.mockResolvedValueOnce({
      data: {
        response: {
          content: [{ channel: 'test-channel', hashTagId: 'test-hash-tag' }],
        },
      },
      headers: { date: serverDate },
    });

    const context = await buildTelemetryContext();

    // timeDiff should be approximately 5 seconds (allow 1s tolerance for execution time)
    expect(context.timeDiff).toBeGreaterThan(4);
    expect(context.timeDiff).toBeLessThan(6);
  });

  it('should default timeDiff to 0 when Date header is missing', async () => {
    mockOrgSearch.mockResolvedValueOnce({
      data: {
        response: {
          content: [{ channel: 'test-channel', hashTagId: 'test-hash-tag' }],
        },
      },
      headers: {},
    });

    const context = await buildTelemetryContext();

    expect(context.timeDiff).toBe(0);
  });

  it('should use fallback channel when org search fails but still get tags from user profile', async () => {
    mockOrgSearch.mockRejectedValueOnce(new Error('network error'));
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const context = await buildTelemetryContext();

    // Channel/app empty when org search fails, but tags come from user profile for logged-in users
    expect(context.channel).toBe('');
    expect(context.tags).toEqual(['org-hash-1', 'org-hash-2']);
    expect(context.dims).toEqual(['org-hash-1', 'org-hash-2']);
    expect(context.app).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('TelemetryContextBuilder: Failed to fetch organization data, proceeding with default values.', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should use empty device ID when getDeviceId fails', async () => {
    vi.mocked(appCoreService.getDeviceId).mockRejectedValueOnce(new Error('device error'));
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const context = await buildTelemetryContext();

    // Should use empty device ID when service fails
    expect(context.did).toBe('');
    expect(consoleSpy).toHaveBeenCalledWith('TelemetryContextBuilder: Failed to get device ID, proceeding with default value.', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should use empty user data when getUserData fails', async () => {
    vi.mocked(userProfileService.getUserData).mockRejectedValueOnce(new Error('user profile error'));
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const context = await buildTelemetryContext();

    expect(context.userData).toEqual({ firstName: '', lastName: '' });
    expect(consoleSpy).toHaveBeenCalledWith('TelemetryContextBuilder: Failed to fetch user profile data, proceeding with default values.', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should use fallback channel when org search throws non-Error object', async () => {
    mockOrgSearch.mockRejectedValueOnce('string error');
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const context = await buildTelemetryContext();

    // Channel/app empty, but tags still from user profile for logged-in users
    expect(context.channel).toBe('');
    expect(context.tags).toEqual(['org-hash-1', 'org-hash-2']);
    expect(context.dims).toEqual(['org-hash-1', 'org-hash-2']);
    expect(context.app).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('TelemetryContextBuilder: Failed to fetch organization data, proceeding with default values.', 'string error');

    consoleSpy.mockRestore();
  });

  it('should fallback uid to anonymous when not available', async () => {
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);

    const context = await buildTelemetryContext();

    expect(context.uid).toBe('anonymous');
  });

  it('should throw error when getPData fails', async () => {
    vi.mocked(appCoreService.getPData).mockRejectedValueOnce(new Error('pdata error'));

    await expect(buildTelemetryContext()).rejects.toThrow('pdata error');
  });

  it('should fallback to sunbird slug when SystemSettingService fails', async () => {
    // Create a new mock instance that throws an error
    vi.mocked(SystemSettingService).mockImplementationOnce(function() {
      return {
        read: vi.fn().mockRejectedValueOnce(new Error('system setting error')),
      };
    });

    // Mock console.warn to verify it's called
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const context = await buildTelemetryContext();

    // Should still build context successfully with fallback slug
    expect(context.channel).toBe('test-channel');
    expect(mockOrgSearch).toHaveBeenCalledWith({ filters: { isTenant: true, slug: 'sunbird' } });
    expect(consoleSpy).toHaveBeenCalledWith('Failed to read default_channel system setting, using fallback:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should use custom slug from SystemSettingService when available', async () => {
    // Create a new mock instance that returns custom value
    vi.mocked(SystemSettingService).mockImplementationOnce(function() {
      return {
        read: vi.fn().mockResolvedValueOnce({
          data: { response: { value: 'custom-channel' } },
        }),
      };
    });

    const context = await buildTelemetryContext();

    expect(mockOrgSearch).toHaveBeenCalledWith({ filters: { isTenant: true, slug: 'custom-channel' } });
    expect(context.channel).toBe('test-channel');
  });

  it('should append courseId and batchId to dims when cdata contains course and batch', async () => {
    const cdata = [
      { id: 'course-123', type: 'course' },
      { id: 'batch-456', type: 'batch' },
    ];
    const context = await buildTelemetryContext({ cdata });

    expect(context.dims).toEqual(['org-hash-1', 'org-hash-2', 'course-123', 'batch-456']);
  });

  it('should append only courseId to dims when cdata has course but no batch', async () => {
    const cdata = [{ id: 'course-123', type: 'course' }];
    const context = await buildTelemetryContext({ cdata });

    expect(context.dims).toEqual(['org-hash-1', 'org-hash-2', 'course-123']);
  });

  it('should not append to dims when cdata has no course entry', async () => {
    const context = await buildTelemetryContext({ cdata: [{ id: 'dial-1', type: 'DialCode' }] });

    expect(context.dims).toEqual(['org-hash-1', 'org-hash-2']);
  });

  it('should set contextRollup to empty when anonymous and no hashTagId', async () => {
    vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);
    mockOrgSearch.mockResolvedValueOnce({
      data: { response: { content: [{ channel: 'test-channel' }] } },
      headers: {},
    });

    const context = await buildTelemetryContext();

    expect(context.contextRollup).toEqual({});
  });
});
