import type { QumlEditorConfig, QumlEditorContextOverrides, QuestionSetMetadata } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';
import userProfileService from '../../UserProfileService';

export class QumlEditorService {
  private orgService = new OrganizationService();

  async createConfig(
    metadata: QuestionSetMetadata,
    contextOverrides?: QumlEditorContextOverrides
  ): Promise<QumlEditorConfig> {
    const sid = userAuthInfoService.getSessionId() || '';
    const uid = userAuthInfoService.getUserId() || 'anonymous';
    const mode = contextOverrides?.mode || 'edit';

    let did = '';
    try {
      did = await appCoreService.getDeviceId();
    } catch {
      // non-fatal
    }

    let channel = '';
    try {
      const filters: Record<string, any> = { isTenant: true };
      const userChannel = await userProfileService.getChannel();
      if (userChannel) filters.slug = userChannel;
      const orgResponse = await this.orgService.search({ filters });
      const org = orgResponse?.data?.response?.content?.[0];
      if (org) channel = org.hashTagId || org.identifier;
    } catch {
      // non-fatal
    }

    const [pdata, cloudStorageUrls] = await Promise.all([
      appCoreService.getPData(),
      appCoreService.getCloudStorageUrls(),
    ]);

    const context = {
      identifier: metadata.identifier,
      mode,
      sid,
      did,
      uid,
      channel,
      pdata,
      contextRollup: contextOverrides?.contextRollup || { l1: channel },
      cdata: contextOverrides?.cdata || [],
      objectRollup: contextOverrides?.objectRollup || {},
      host: window.location.origin,
      endpoint: '',
      timeDiff: 0,
      cloudStorageUrls,
      user: {
        id: uid,
        orgIds: [channel],
      },
    };

    return {
      context,
      config: {
        apiSlug: '/portal',
        mode,
        primaryCategory: metadata.primaryCategory,
        objectType: metadata.objectType,
        showAddCollaborator: false,
        questionSet: { maxQuestionsLimit: 500 },
        // The editor's preview loads the QuML player from this path — the
        // portal serves the player bundle under /assets/quml-player/.
        playerScriptUrl: '/assets/quml-player/sunbird-quml-player.js',
      },
      metadata,
    };
  }
}
