import { ContentEditorConfig, ContentEditorMetadata } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';
import { ChannelService } from '../../ChannelService';
import userProfileService from '../../UserProfileService';
import { fetchFwCategoryMeta } from '../fwCategoryMetaService';
import { TELEMETRY_ENDPOINT } from '../../players/telemetryContextBuilder';

const CONTENT_EDITOR_URL = '/content-editor/index.html';

export class ContentEditorService {
  private orgService = new OrganizationService();
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
      const userChannel = await userProfileService.getChannel();
      if (userChannel) filters.slug = userChannel;
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

    let contentFields: any = [];
    let fwCategoryDetails: any = {};
    try {
      const meta = await fetchFwCategoryMeta(framework);
      contentFields = meta.contentFields;
      fwCategoryDetails = meta.fwCategoryDetails;
    } catch (error) {
      console.warn('Failed to fetch framework category metadata:', error);
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
        { id: 'org.ekstep.sunbirdcommonheader', ver: '2.0', type: 'plugin' },
        { id: 'org.ekstep.sunbirdmetadata', ver: '1.1', type: 'plugin' },
        { id: 'org.ekstep.metadata', ver: '1.5', type: 'plugin' },
        { id: 'org.ekstep.questionset', ver: '1.0', type: 'plugin' },
        { id: 'org.ekstep.reviewercomments', ver: '1.0', type: 'plugin' },
      ],
      corePluginsPackaged: true,
      dispatcher: 'local',
      localDispatcherEndpoint: TELEMETRY_ENDPOINT,
      modalId: 'contentEditor',
      alertOnUnload: true,
      headerLogo: '',
      showHelp: false,
      previewConfig: {
        repos: ['/content-plugins/renderer'],
        plugins: [
          { id: 'org.sunbird.player.endpage', ver: '1.1', type: 'plugin' },
        ],
        showStartPage: true,
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
      contentFields,
      fwCategoryDetails,
    };

    return { context, config };
  }

  getEditorUrl(): string {
    return CONTENT_EDITOR_URL;
  }
}
