import { EcmlPlayerContextProps, EcmlPlayerMetadata } from './types';
import { buildTelemetryContext } from '../telemetryContextBuilder';
import appCoreService from '../../AppCoreService';

const PREVIEW_URL = '/content/preview/preview.html?webview=true';

export class EcmlPlayerService {
  async createConfig(
    metadata: EcmlPlayerMetadata,
    contextProps?: EcmlPlayerContextProps
  ) {
    const [context, buildHash] = await Promise.all([
      buildTelemetryContext(contextProps, { contentId: metadata.identifier }),
      appCoreService.getBuildHash(),
    ]);

    const config = {
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
      build_number: buildHash,
    };

    return {
      context,
      config,
      metadata,
      data: metadata.body || {},
    };
  }

  buildPlayerUrl(buildHash?: string): string {
    if (buildHash) return `${PREVIEW_URL}&build_number=${buildHash}`;
    return PREVIEW_URL;
  }
}
