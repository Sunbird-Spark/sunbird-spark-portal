import { EcmlPlayerContextProps, EcmlPlayerMetadata } from './types';
import { buildTelemetryContext } from '../telemetryContextBuilder';
import appCoreService from '../../AppCoreService';

const PREVIEW_URL = '/content/preview/preview.html?webview=true';

export class EcmlPlayerService {
  async createConfig(
    metadata: EcmlPlayerMetadata,
    contextProps?: EcmlPlayerContextProps
  ) {
    const context = await buildTelemetryContext(contextProps, { contentId: metadata.identifier });

    const config = {
      version: await appCoreService.getBuildHash(),
      showEndPage: false,
      endPage: [{ template: 'assessment', contentType: ['SelfAssess'] }],
      showStartPage: true,
      host: '',
      overlay: { showUser: false },
      splash: {
        text: '',
        icon: '',
        bgImage: 'assets/icons/splacebackground_1.png',
        webLink: '',
      },
      apislug: '/action',
      repos: ['/content-plugins/renderer'],
      plugins: [
        { id: 'org.sunbird.iframeEvent', ver: 1.0, type: 'plugin' },
        { id: 'org.sunbird.player.endpage', ver: 1.1, type: 'plugin' },
      ],
      sideMenu: {
        showShare: true,
        showDownload: true,
        showExit: false,
        showPrint: true,
        showReplay: true,
      },
      enableTelemetryValidation: false,
    };

    return {
      context,
      config,
      metadata,
      data: metadata.body || {},
    };
  }

  buildPlayerUrl(): string {
    return PREVIEW_URL;
  }
}
