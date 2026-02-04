import { PdfPlayerConfig, PdfPlayerOptions } from '../types';

// Declare the custom element for React/TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sunbird-pdf-player': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'player-config'?: string;
        },
        HTMLElement
      >;
    }
  }
}

// Sunbird PDF Player specific configuration structure
export interface SunbirdPdfPlayerConfig {
  context: {
    mode: string;
    authToken: string;
    sid: string;
    did: string;
    uid: string;
    channel: string;
    pdata: {
      id: string;
      ver: string;
      pid: string;
    };
    contextRollup: Record<string, string>;
    tags: string[];
    cdata: any[];
    timeDiff: number;
    objectRollup: Record<string, any>;
    host: string;
    endpoint: string;
    userData: {
      firstName: string;
      lastName: string;
    };
  };
  config: {
    sideMenu: {
      showShare: boolean;
      showDownload: boolean;
      showReplay: boolean;
      showExit: boolean;
      showPrint: boolean;
    };
  };
  metadata: {
    identifier: string;
    name: string;
    artifactUrl: string;
    streamingUrl?: string;
    compatibilityLevel?: number;
    pkgVersion?: number;
    isAvailableLocally?: boolean;
    basePath?: string;
    baseDir?: string;
  };
}