/**
 * Service for managing the Generic Editor lifecycle.
 * Handles building window.context, window.config, content locking,
 * and iframe management for the generic editor.
 *
 * Port of the Angular GenericEditorComponent from SunbirdEd-portal.
 */

import { getClient } from '../../../lib/http-client';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';
import { ChannelService } from '../../ChannelService';
import {
  GENERIC_EDITOR_WINDOW_CONFIG,
  DEFAULT_EXT_CONT_WHITELISTED_DOMAINS,
  DEFAULT_VIDEO_MAX_SIZE,
  DEFAULT_CONTENT_FILE_SIZE,
  VALID_CONTENT_STATUSES,
  VALID_CONTENT_STATES,
  EDITABLE_STATES,
  DEFAULT_PRIMARY_CATEGORIES,
} from './editorConfig';
import { GENERIC_EDITOR_MIME_TYPES } from './types';
import type {
  GenericEditorContext,
  GenericEditorWindowConfig,
  GenericEditorRouteParams,
  GenericEditorQueryParams,
  ContentDetails,
  LockContentResponse,
} from './types';

declare global {
  interface Window {
    context: GenericEditorContext;
    config: GenericEditorWindowConfig;
  }
}

export class GenericEditorService {
  private orgService = new OrganizationService();
  private channelService = new ChannelService();

  /**
   * Get the generic editor URL.
   * Reads from a hidden input element (same pattern as Angular portal),
   * falls back to env var or default path.
   */
  getEditorUrl(): string {
    return import.meta.env.VITE_GENERIC_EDITOR_URL || '/generic-editor/index.html';
  }

  /**
   * Fetch content details for editing.
   */
  async getContentDetails(contentId: string): Promise<ContentDetails> {
    const response = await getClient().get<{ result: { content: ContentDetails } }>(
      `/content/v1/read/${contentId}?mode=edit`
    );
    return response.data.result.content;
  }

  /**
   * Lock content to prevent concurrent edits.
   */
  async lockContent(
    contentId: string,
    userId: string,
    userName: string,
    framework?: string,
    contentType?: string
  ): Promise<LockContentResponse> {
    const contentInfo = {
      contentType: contentType || 'Resource',
      framework: framework || '',
      identifier: contentId,
    };
    const input = {
      resourceId: contentId,
      resourceType: 'Content',
      resourceInfo: JSON.stringify(contentInfo),
      creatorInfo: JSON.stringify({ name: userName, id: userId }),
      createdBy: userId,
    };
    const response = await getClient().post<{ result: LockContentResponse }>(
      '/lock/v1/create',
      { request: input }
    );
    return response.data.result;
  }

  /**
   * Release content lock after editing.
   */
  async retireLock(contentId: string): Promise<void> {
    await getClient().post('/lock/v1/retire', {
      request: {
        resourceId: contentId,
        resourceType: 'Content',
      },
    });
  }

  /**
   * Validate whether the user has permission to edit this content.
   * Mirrors the Angular validateRequest() logic.
   */
  validateRequest(
    contentDetails: ContentDetails,
    userId: string,
    routeState?: string
  ): boolean {
    const isGenericMime = GENERIC_EDITOR_MIME_TYPES.includes(
      contentDetails.mimeType as any
    );
    const isValidStatus = VALID_CONTENT_STATUSES.some(
      (s) => s.toLowerCase() === (contentDetails.status || '').toLowerCase()
    );
    const isValidState = routeState
      ? VALID_CONTENT_STATES.includes(routeState as any)
      : false;

    if (!isGenericMime || !isValidStatus) {
      return false;
    }

    // Creator always has access
    if (contentDetails.createdBy === userId) {
      return true;
    }
    // Collaborator with valid state
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
   * Build the window.context object that the generic editor reads from.
   * Mirrors the Angular setWindowContext() method.
   */
  async buildEditorContext(
    params: GenericEditorRouteParams,
    contentDetails?: ContentDetails,
    isLargeFileUpload?: boolean
  ): Promise<GenericEditorContext> {
    const sid = userAuthInfoService.getSessionId() || `session-${Date.now()}`;
    const uid = userAuthInfoService.getUserId() || 'anonymous';

    let did = '';
    try {
      did = await appCoreService.getDeviceId();
    } catch {
      console.warn('Failed to get device ID for editor context');
    }

    // Get channel from org service
    let channel = '';
    try {
      const orgResponse = await this.orgService.search({
        filters: { isTenant: true },
      });
      const org = orgResponse?.data?.result?.response?.content?.[0];
      if (org?.channel) {
        channel = org.channel;
      }
    } catch {
      console.warn('Failed to get channel from org service');
    }

    // Fetch default framework from channel if not provided via route params
    let framework = params.framework || '';
    if (!framework && channel) {
      try {
        const channelResponse = await this.channelService.read(channel);
        const defaultFramework = channelResponse?.data?.result?.channel?.defaultFramework;
        console.log('Fetched default framework from channel:', defaultFramework);
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
        name: 'User',
        orgIds: [],
        organisations: {},
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
      framework: framework || 'NCF',
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

  /**
   * Build the window.config object that the generic editor reads from.
   * Mirrors the Angular setWindowConfig() method.
   */
  buildEditorConfig(
    lockParams?: GenericEditorQueryParams,
    headerLogo?: string
  ): GenericEditorWindowConfig {
    return {
      ...GENERIC_EDITOR_WINDOW_CONFIG,
      build_number: '1.0',
      headerLogo: headerLogo || '',
      lock: {
        lockKey: lockParams?.lockKey,
        expiresAt: lockParams?.expiresAt,
        expiresIn: lockParams?.expiresIn,
      },
      extContWhitelistedDomains: DEFAULT_EXT_CONT_WHITELISTED_DOMAINS,
      enableTelemetryValidation: false,
      videoMaxSize: DEFAULT_VIDEO_MAX_SIZE,
      defaultContentFileSize: DEFAULT_CONTENT_FILE_SIZE,
    };
  }

  /**
   * Check whether content should be locked before editing.
   * Mirrors the Angular getDetails() lock logic.
   */
  shouldLockContent(
    routeState?: string,
    contentStatus?: string,
    queryParams?: GenericEditorQueryParams
  ): boolean {
    const hasExistingLock =
      queryParams?.lockKey || queryParams?.expiresAt || queryParams?.expiresIn;
    if (hasExistingLock) return false;

    const isEditableState = EDITABLE_STATES.includes(routeState as any);
    const isDraft = contentStatus
      ? contentStatus.toLowerCase() === 'draft'
      : false;

    return isEditableState && isDraft;
  }

  /**
   * Set window.context and window.config globals for the editor iframe.
   * The generic editor iframe reads these globals on load.
   */
  setWindowGlobals(
    context: GenericEditorContext,
    config: GenericEditorWindowConfig
  ): void {
    (window as any).context = context;
    (window as any).config = config;
  }

  /**
   * Clean up window globals set for the editor.
   */
  clearWindowGlobals(): void {
    delete (window as any).context;
    delete (window as any).config;
  }
}
