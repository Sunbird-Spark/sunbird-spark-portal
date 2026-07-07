import { getClient } from '../../../lib/http-client';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';
import { ChannelService } from '../../ChannelService';
import userProfileService from '../../UserProfileService';
import {
  DEFAULT_PRIMARY_CATEGORIES,
  VALID_CONTENT_STATUSES,
  VALID_CONTENT_STATES,
} from './editorConfig';
import { GENERIC_EDITOR_MIME_TYPES } from './types';
import type {
  GenericEditorContext,
  GenericEditorRouteParams,
  ContentDetails,
} from './types';

/**
 * Builds the editor context consumed by the native @project-sunbird/generic-editor-v2
 * editor (GenericEditor). The legacy iframe editor and its window-globals/lock/config
 * plumbing have been removed — the v2 library manages its own lock and preview.
 */
export class GenericEditorService {
  private orgService = new OrganizationService();
  private channelService = new ChannelService();

  /** Read content metadata (edit mode) for the permission pre-check. */
  async getContentDetails(contentId: string): Promise<ContentDetails> {
    const response = await getClient().get<{ content: ContentDetails }>(
      `/content/v1/read/${contentId}?mode=edit`
    );
    return response.data.content;
  }

  /**
   * Client-side access gate mirroring the legacy editor: gates the editor UI by mime type,
   * status and creator/collaborator/state. This is UX/defense-in-depth only — it is NOT a
   * security boundary (a determined user can bypass it). Per-content authorization must be
   * enforced upstream (knowledge-mw-service); the portal `/action` proxy only checks auth.
   */
  validateRequest(
    contentDetails: ContentDetails,
    userId: string,
    routeState?: string
  ): boolean {
    const isGenericMime = GENERIC_EDITOR_MIME_TYPES.includes(
      contentDetails.mimeType as never
    );
    const isValidStatus = VALID_CONTENT_STATUSES.some(
      (s) => s.toLowerCase() === (contentDetails.status || '').toLowerCase()
    );
    const isValidState = routeState
      ? VALID_CONTENT_STATES.includes(routeState as never)
      : false;

    if (!isGenericMime || !isValidStatus) {
      return false;
    }
    // Creator always has access
    if (contentDetails.createdBy === userId) {
      return true;
    }
    // Collaborator with a valid state
    if (isValidState && contentDetails.collaborators?.includes(userId)) {
      return true;
    }
    // Valid state allows access (e.g. reviewer)
    if (isValidState) {
      return true;
    }
    return false;
  }

  async buildEditorContext(
    params: GenericEditorRouteParams,
    contentDetails?: ContentDetails,
    isLargeFileUpload?: boolean
  ): Promise<GenericEditorContext> {
    const sid = userAuthInfoService.getSessionId() || `session-${Date.now()}`;
    const uid = userAuthInfoService.getUserId() || 'anonymous';

    let creatorName = '';
    try {
      const { firstName: first, lastName: last } = await userProfileService.getUserData();
      creatorName = first || last ? [first, last].filter(Boolean).join(' ') : 'anonymous';
    } catch {
      console.warn('Failed to get user name for editor context');
    }

    let did = '';
    try {
      did = await appCoreService.getDeviceId();
    } catch {
      console.warn('Failed to get device ID for editor context');
    }

    // Fetch channel slug from user profile, then get org details
    let channel = '';
    let orgName = '';
    try {
      const slug = await userProfileService.getChannel();
      const orgResponse = await this.orgService.search({
        filters: { slug, isTenant: true },
      });
      const org = orgResponse?.data?.response?.content?.[0];
      if (org?.channel) {
        channel = org.hashTagId;
      }
      orgName = org?.orgName || '';
    } catch {
      console.warn('Failed to get channel from org service');
    }

    // Fetch default framework from channel if not provided via route params
    let framework = params.framework || '';
    if (!framework && channel) {
      try {
        const channelResponse = await this.channelService.read(channel);
        const defaultFramework = (channelResponse as any)?.data?.channel?.defaultFramework;
        console.warn('Fetched default framework from channel:', defaultFramework);
        if (defaultFramework) {
          framework = defaultFramework;
        }
      } catch {
        console.warn('Failed to fetch default framework from channel');
      }
    }

    // Build pdata (producer data for telemetry)
    let pdata = { id: 'sunbird.portal', ver: '1.0', pid: 'sunbird-portal' };
    try {
      const pdataResult = await appCoreService.getPData();
      pdata = { ...pdataResult, pid: 'sunbird-portal' };
    } catch {
      // use default pdata
    }

    const context: GenericEditorContext = {
      user: {
        id: uid,
        name: creatorName,
        orgIds: [],
        organisations: channel ? { [channel]: orgName } : {},
      },
      did,
      sid,
      contentId: params.contentId || '',
      pdata,
      contextRollUp: channel ? { l1: channel } : {},
      tags: [],
      channel,
      defaultLicense: 'CC BY 4.0',
      env: 'generic-editor',
      framework: framework,
      ownershipType: ['createdBy'],
      timeDiff: 0,
      instance: 'SUNBIRD',
      primaryCategories: [...DEFAULT_PRIMARY_CATEGORIES],
    };

    if (
      isLargeFileUpload ||
      contentDetails?.contentDisposition === 'online-only'
    ) {
      context.uploadInfo = { isLargeFileUpload: true };
    }

    return context;
  }
}
