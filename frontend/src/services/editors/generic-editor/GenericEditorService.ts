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
  EDITOR_ASSET_CREATE_URL,
  editorAssetUploadUrl,
  EDITOR_TELEMETRY_URL,
} from './editorConfig';
import { GENERIC_EDITOR_MIME_TYPES } from './types';
import type {
  GenericEditorContext,
  GenericEditorRouteParams,
  ContentDetails,
} from './types';
import type { TelemetryEvent } from '@project-sunbird/generic-editor-v2';

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

  /**
   * Upload an image asset (thumbnail/appIcon) and return its artifactUrl.
   * Uses the knowledge-mw `/action` asset endpoints (create → multipart upload).
   */
  async uploadAsset(file: File, creator?: string, createdBy?: string): Promise<string> {
    const createResp = await fetch(EDITOR_ASSET_CREATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        request: {
          content: {
            name: file.name,
            mimeType: file.type || 'image/png',
            mediaType: 'image',
            contentType: 'Asset',
            primaryCategory: 'Asset',
            code: `asset-${Date.now()}`,
            ...(creator ? { creator } : {}),
            ...(createdBy ? { createdBy } : {}),
          },
        },
      }),
    });
    const created = await createResp.json();
    const assetId = created?.result?.identifier ?? created?.result?.node_id;
    if (!assetId) throw new Error('Asset create failed');

    const form = new FormData();
    form.append('file', file);
    const upResp = await fetch(editorAssetUploadUrl(assetId), {
      method: 'POST',
      credentials: 'same-origin',
      body: form,
    });
    const up = await upResp.json();
    const url = up?.result?.artifactUrl ?? up?.result?.content_url;
    if (!url) throw new Error('Asset upload failed');
    return String(url);
  }

  /** Forward an editor telemetry event to the portal telemetry endpoint (best-effort). */
  postTelemetry(event: TelemetryEvent): void {
    try {
      fetch(EDITOR_TELEMETRY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          id: 'api.telemetry',
          ver: '3.0',
          ts: new Date().toISOString(),
          events: [event],
          params: { msgid: event.mid },
        }),
      }).catch(() => {});
    } catch {
      /* non-fatal */
    }
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
