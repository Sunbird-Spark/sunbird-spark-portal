import { ContentEditorConfig, ContentEditorMetadata } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';

const CONTENT_EDITOR_URL = '/content-editor/index.html';

export class ContentEditorService {
  private orgService = new OrganizationService();

  async buildConfig(
    metadata: ContentEditorMetadata
  ): Promise<ContentEditorConfig> {
    const sid = userAuthInfoService.getSessionId();
    const uid = userAuthInfoService.getUserId() || 'anonymous';

    let did = '';
    try {
      did = await appCoreService.getDeviceId();
    } catch (error) {
      console.warn('Failed to fetch device ID, using fallback:', error);
    }

    let channel = '';
    let hashTagId = '';
    try {
      const orgResponse = await this.orgService.search({
        filters: { isTenant: true },
      });
      const org = (orgResponse as any)?.data?.result?.response?.content?.[0];
      if (org?.channel) {
        channel = org.channel;
      }
      if (org?.hashTagId) {
        hashTagId = org.hashTagId;
      }
    } catch (error) {
      console.warn('Failed to fetch channel from org service:', error);
    }

    const tags = hashTagId ? [hashTagId] : channel ? [channel] : [];
    const pdata = await appCoreService.getPData();

    const context = {
      user: {
        id: uid,
        name: 'anonymous',
        orgIds: tags,
        organisations: {},
      },
      sid,
      contentId: metadata.identifier,
      pdata,
      channel,
      framework: metadata.framework || 'NCF',
      uid,
      did,
      defaultLicense: 'CC BY 4.0',
      contextRollup: { l1: channel },
      tags,
      timeDiff: 0,
    };

    const config = {
      baseURL: '',
      apislug: '/action',
      build_number: '1.0',
      pluginRepo: '/content-plugins',
      aws_s3_urls: [],
      plugins: [
        { id: 'org.ekstep.sunbirdcommonheader', ver: '1.9', type: 'plugin' },
        { id: 'org.ekstep.sunbirdmetadata', ver: '1.1', type: 'plugin' },
        { id: 'org.ekstep.metadata', ver: '1.5', type: 'plugin' },
        { id: 'org.ekstep.questionset', ver: '1.0', type: 'plugin' },
        { id: 'org.ekstep.reviewercomments', ver: '1.0', type: 'plugin' },
      ],
      corePluginsPackaged: true,
      dispatcher: 'local',
      localDispatcherEndpoint: '/portal/data/v1/telemetry',
      modalId: 'contentEditor',
      alertOnUnload: true,
      headerLogo: '',
      showHelp: false,
      previewConfig: {
        repos: ['/content-plugins/renderer'],
        plugins: [
          { id: 'org.sunbird.iframeEvent', ver: '1.0', type: 'plugin' },
          { id: 'org.sunbird.player.endpage', ver: '1.1', type: 'plugin' },
        ],
        splash: {
          text: '',
          icon: '',
          bgImage: 'assets/icons/splacebackground_1.png',
          webLink: '',
        },
        showEndPage: false,
      },
      enableTelemetryValidation: false,
      cloudStorage: {
        provider: '',
      },
    };

    return { context, config };
  }

  getEditorUrl(): string {
    return CONTENT_EDITOR_URL;
  }
}
