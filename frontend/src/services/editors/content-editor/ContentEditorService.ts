import { ContentEditorConfig, ContentEditorMetadata } from './types';
import editorConfigService from '../EditorConfigService';

const CONTENT_EDITOR_URL = '/content-editor/index.html';

export class ContentEditorService {
  async buildConfig(
    metadata: ContentEditorMetadata
  ): Promise<ContentEditorConfig> {
    const { sid, uid, did, channel, pdata } = await editorConfigService.fetchBaseContext();
    const { framework } = channel
      ? await editorConfigService.fetchChannelData(channel)
      : { framework: '' };
    const tags = channel ? [channel] : [];

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
    };

    return { context, config };
  }

  getEditorUrl(): string {
    return CONTENT_EDITOR_URL;
  }
}
