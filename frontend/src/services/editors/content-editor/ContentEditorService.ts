import { ContentEditorConfig, ContentEditorMetadata } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';
import { SystemSettingService } from '../../SystemSettingService';
import { ChannelService } from '../../ChannelService';

const CONTENT_EDITOR_URL = '/content-editor/index.html';

export class ContentEditorService {
  private orgService = new OrganizationService();
  private systemSettingService = new SystemSettingService();
  private channelService = new ChannelService();
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
    try {
      const filters: Record<string, any> = { isTenant: true };
      try {
        const settingResponse = await this.systemSettingService.read('default_channel');
        const slugValue = (settingResponse as any)?.data?.response?.value;
        if (slugValue) {
          filters.slug = slugValue;
        }
      } catch (err) {
        console.warn('Failed to fetch default channel system setting:', err);
      }
      const orgResponse = await this.orgService.search({ filters });
      const org = orgResponse?.data?.response?.content?.[0];
      if (org) {
        channel = org.hashTagId || org.identifier;
      }
    } catch (error) {
      console.warn('Failed to fetch channel info:', error);
    }
    const tags = channel ? [channel] : [];

    let framework = '';
    if (channel) {
      try {
        const channelResponse = await this.channelService.read(channel);
        const frameworks = (channelResponse as any)?.data?.channel?.frameworks;
        if (Array.isArray(frameworks) && frameworks.length > 0) {
          framework = frameworks[0]?.identifier || '';
        }
      } catch (error) {
        console.warn('Failed to fetch channel framework:', error);
      }
    }
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
      framework,
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
