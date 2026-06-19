import type { IEditorConfig, EditorMode } from '@project-sunbird/collection-editor-react';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';
import { ChannelService } from '../../ChannelService';
import userProfileService from '../../UserProfileService';

const orgService = new OrganizationService();
const channelService = new ChannelService();

const VALID_MODES = new Set<EditorMode>(['edit', 'review', 'read', 'sourcingreview']);

export async function buildCollectionEditorConfig(
  metadata: Record<string, any>,
  mode: string,
): Promise<IEditorConfig> {
  const editorMode: EditorMode = VALID_MODES.has(mode as EditorMode) ? (mode as EditorMode) : 'edit';
  const sid = userAuthInfoService.getSessionId() || '';
  const userId = userAuthInfoService.getUserId() || 'anonymous';

  let did = '';
  try {
    did = await appCoreService.getDeviceId();
  } catch {
    // non-fatal
  }

  let channel = '';
  try {
    const userChannel = await userProfileService.getChannel();
    const filters: Record<string, any> = { isTenant: true };
    if (userChannel) filters.slug = userChannel;
    const orgResponse = await orgService.search({ filters });
    const org = orgResponse?.data?.response?.content?.[0];
    if (org) channel = org.hashTagId || org.identifier;
  } catch {
    // non-fatal
  }

  let framework = (metadata.framework as string) || '';
  if (channel && !framework) {
    try {
      const channelResponse = await channelService.read(channel);
      const frameworks = (channelResponse as any)?.data?.channel?.frameworks;
      if (Array.isArray(frameworks) && frameworks.length > 0) {
        framework = frameworks[0]?.identifier || '';
      }
    } catch {
      // non-fatal
    }
  }

  const pdata = await appCoreService.getPData();

  return {
    context: {
      // Portal proxies all API calls through the backend; auth is handled via
      // session cookies so no explicit bearer token is needed client-side.
      authToken: '',
      userId,
      sid,
      did,
      uid: userId,
      channel,
      pdata,
      env: 'collection_editor',
      identifier: metadata.identifier,
      contentId: metadata.identifier,
      framework,
      targetFWIds: (metadata.targetFWIds as string[]) || [],
    },
    config: {
      mode: editorMode,
      objectType: 'Collection',
      primaryCategory: metadata.primaryCategory || 'Content Playlist',
      framework: framework ? [framework] : [],
      targetFWIds: (metadata.targetFWIds as string[]) || [],
      maxDepth: 4,
    },
    metadata,
  };
}
