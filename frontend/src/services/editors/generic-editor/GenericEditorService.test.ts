import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GenericEditorService } from './GenericEditorService';
import type { ContentDetails } from './types';
import { GENERIC_EDITOR_MIME_TYPES } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { DEFAULT_PRIMARY_CATEGORIES } from './editorConfig';

const mockGet = vi.fn();

vi.mock('../../../lib/http-client', () => ({
  getClient: () => ({ get: mockGet }),
}));

vi.mock('../../userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getSessionId: vi.fn(() => 'session-abc'),
    getUserId: vi.fn(() => 'user-123'),
  },
}));

vi.mock('../../AppCoreService', () => ({
  default: {
    getDeviceId: vi.fn(() => Promise.resolve('device-456')),
    getPData: vi.fn(() =>
      Promise.resolve({ id: 'test.portal', ver: '2.0', pid: 'test-pid' })
    ),
  },
}));

const mockOrgSearch = vi.fn();

vi.mock('../../OrganizationService', () => ({
  OrganizationService: class {
    search = mockOrgSearch;
  },
}));

const mockChannelRead = vi.fn();

vi.mock('../../ChannelService', () => ({
  ChannelService: class {
    read = mockChannelRead;
  },
}));

vi.mock('../../UserProfileService', () => ({
  default: { getChannel: vi.fn(), getUserData: vi.fn(), clearCache: vi.fn() },
}));

import userProfileService from '../../UserProfileService';

describe('GenericEditorService', () => {
  let service: GenericEditorService;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(userProfileService.getChannel).mockResolvedValue('test-slug');
    vi.mocked(userProfileService.getUserData).mockResolvedValue({
      firstName: 'Test',
      lastName: 'User',
    } as any);

    mockOrgSearch.mockResolvedValue({
      data: {
        response: {
          content: [
            {
              channel: 'test-channel',
              hashTagId: 'test-channel',
              identifier: 'org-1',
            },
          ],
        },
      },
    });

    mockChannelRead.mockResolvedValue({
      data: {
        channel: {
          defaultFramework: 'TPD',
        },
      },
    });

    service = new GenericEditorService();
  });

  const mockContentDetails: ContentDetails = {
    identifier: 'do_123',
    name: 'Test PDF',
    status: 'Draft',
    mimeType: 'application/pdf',
    createdBy: 'user-123',
    framework: 'NCF',
  };

  describe('getContentDetails', () => {
    it('reads content in edit mode and returns the content node', async () => {
      mockGet.mockResolvedValue({ data: { content: mockContentDetails } });

      const result = await service.getContentDetails('do_123');

      expect(mockGet).toHaveBeenCalledWith('/content/v1/read/do_123?mode=edit');
      expect(result).toEqual(mockContentDetails);
    });
  });

  describe('validateRequest', () => {
    it('allows the creator with valid mime + status', () => {
      expect(service.validateRequest(mockContentDetails, 'user-123')).toBe(true);
    });

    it('allows a collaborator with a valid state', () => {
      const content: ContentDetails = {
        ...mockContentDetails,
        createdBy: 'other-user',
        collaborators: ['user-123'],
      };
      expect(service.validateRequest(content, 'user-123', 'collaborating-on')).toBe(true);
    });

    it('allows a valid state even if not creator/collaborator (reviewer)', () => {
      const content: ContentDetails = { ...mockContentDetails, createdBy: 'other-user' };
      expect(service.validateRequest(content, 'user-123', 'upForReview')).toBe(true);
    });

    it('rejects an unsupported mime type', () => {
      const content: ContentDetails = {
        ...mockContentDetails,
        mimeType: 'application/vnd.ekstep.ecml-archive',
      };
      expect(service.validateRequest(content, 'user-123')).toBe(false);
    });

    it('rejects an invalid status', () => {
      const content: ContentDetails = { ...mockContentDetails, status: 'Retired' };
      expect(service.validateRequest(content, 'user-123')).toBe(false);
    });

    it('rejects a non-owner with no valid state', () => {
      const content: ContentDetails = { ...mockContentDetails, createdBy: 'other-user' };
      expect(service.validateRequest(content, 'user-123')).toBe(false);
    });

    it('compares status case-insensitively', () => {
      const content: ContentDetails = { ...mockContentDetails, status: 'draft' };
      expect(service.validateRequest(content, 'user-123')).toBe(true);
    });

    it('accepts every supported mime type for the creator', () => {
      for (const mimeType of GENERIC_EDITOR_MIME_TYPES) {
        expect(
          service.validateRequest({ ...mockContentDetails, mimeType }, 'user-123')
        ).toBe(true);
      }
    });
  });

  describe('buildEditorContext', () => {
    it('should build correct context object with all fields', async () => {
      const context = await service.buildEditorContext({
        contentId: 'do_123',
        framework: 'TPD',
      });

      expect(vi.mocked(userProfileService.getChannel)).toHaveBeenCalled();
      expect(mockOrgSearch).toHaveBeenCalledWith({
        filters: { slug: 'test-slug', isTenant: true },
      });
      expect(context.user.id).toBe('user-123');
      expect(context.sid).toBe('session-abc');
      expect(context.did).toBe('device-456');
      expect(context.contentId).toBe('do_123');
      expect(context.channel).toBe('test-channel');
      expect(context.framework).toBe('TPD');
      expect(context.defaultLicense).toBe('CC BY 4.0');
      expect(context.env).toBe('generic-editor');
      expect(context.instance).toBe('SUNBIRD');
      expect(context.ownershipType).toEqual(['createdBy']);
      expect(context.primaryCategories).toEqual([...DEFAULT_PRIMARY_CATEGORIES]);
      expect(context.pdata).toEqual({
        id: 'test.portal',
        ver: '2.0',
        pid: 'sunbird-portal',
      });
      expect(context.contextRollUp).toEqual({ l1: 'test-channel' });
    });

    it('should use fallback session ID when not available', async () => {
      vi.mocked(userAuthInfoService.getSessionId).mockReturnValue(null);

      const context = await service.buildEditorContext({ contentId: 'do_1' });

      expect(context.sid).toMatch(/^session-\d+$/);
    });

    it('should use anonymous when userId is not available', async () => {
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue(null);

      const context = await service.buildEditorContext({ contentId: 'do_1' });

      expect(context.user.id).toBe('anonymous');
    });

    it('should use empty string when device ID fails', async () => {
      vi.mocked(appCoreService.getDeviceId).mockRejectedValue(new Error('fail'));

      const context = await service.buildEditorContext({ contentId: 'do_1' });

      expect(context.did).toBe('');
    });

    it('should use empty slug when user profile channel is empty', async () => {
      vi.mocked(userProfileService.getChannel).mockResolvedValue('');

      const context = await service.buildEditorContext({ contentId: 'do_1' });

      expect(mockOrgSearch).toHaveBeenCalledWith({
        filters: { slug: '', isTenant: true },
      });
      expect(context.channel).toBe('test-channel');
    });

    it('should use empty string when org service fails', async () => {
      mockOrgSearch.mockRejectedValue(new Error('network error'));

      const context = await service.buildEditorContext({ contentId: 'do_1' });

      expect(context.channel).toBe('');
    });

    it('should fetch default framework from channel when not provided', async () => {
      const context = await service.buildEditorContext({ contentId: 'do_1' });

      expect(mockChannelRead).toHaveBeenCalledWith('test-channel');
      expect(context.framework).toBe('TPD');
    });

    it('should default to empty string when no framework available', async () => {
      mockOrgSearch.mockResolvedValue({
        data: { response: { content: [] } },
      });

      const context = await service.buildEditorContext({ contentId: 'do_1' });

      expect(context.framework).toBe('');
    });

    it('should not fetch channel framework when provided in params', async () => {
      const context = await service.buildEditorContext({
        contentId: 'do_1',
        framework: 'MyFramework',
      });

      expect(mockChannelRead).not.toHaveBeenCalled();
      expect(context.framework).toBe('MyFramework');
    });

    it('should set uploadInfo for large file uploads', async () => {
      const context = await service.buildEditorContext(
        { contentId: 'do_1' },
        undefined,
        true
      );

      expect(context.uploadInfo).toEqual({ isLargeFileUpload: true });
    });

    it('should set uploadInfo when content disposition is online-only', async () => {
      const content: ContentDetails = {
        identifier: 'do_1',
        contentDisposition: 'online-only',
      };

      const context = await service.buildEditorContext(
        { contentId: 'do_1' },
        content
      );

      expect(context.uploadInfo).toEqual({ isLargeFileUpload: true });
    });

    it('should use default pdata when getPData fails', async () => {
      vi.mocked(appCoreService.getPData).mockRejectedValue(new Error('fail'));

      const context = await service.buildEditorContext({ contentId: 'do_1' });

      expect(context.pdata).toEqual({
        id: 'sunbird.portal',
        ver: '1.0',
        pid: 'sunbird-portal',
      });
    });
  });
});
