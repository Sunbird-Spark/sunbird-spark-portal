export interface EcmlPlayerContextProps {
  mode?: string;
  cdata?: any[];
  contextRollup?: {
    l1: string;
  };
  objectRollup?: Record<string, any>;
}

export interface EcmlPlayerMetadata {
  identifier: string;
  name: string;
  artifactUrl: string;
  streamingUrl?: string;
  compatibilityLevel?: number;
  pkgVersion?: number;
  mimeType?: string;
  contentType?: string;
  [key: string]: any;
}

export interface EcmlPlayerConfig {
  context: {
    mode: string;
    sid: string;
    did: string;
    uid: string;
    channel: string;
    pdata: {
      id: string;
      ver: string;
      pid: string;
    };
    contextRollup: {
      l1: string;
    };
    cdata: any[];
    timeDiff: number;
    objectRollup: Record<string, any>;
    host: string;
    endpoint: string;
    partner?: any[];
  };
  config: {
    showEndPage: boolean;
    endPage?: Array<{ template: string; contentType: string[] }>;
    showStartPage: boolean;
    host: string;
    overlay: {
      showUser: boolean;
    };
    splash: {
      text: string;
      icon: string;
      bgImage: string;
      webLink: string;
    };
    apislug: string;
    repos: string[];
    plugins: Array<{ id: string; ver: number; type: string }>;
    sideMenu: {
      showShare: boolean;
      showDownload: boolean;
      showExit: boolean;
      showPrint?: boolean;
      showReplay?: boolean;
    };
  };
  metadata: EcmlPlayerMetadata;
}

export interface EcmlPlayerEvent {
  type: string;
  data: any;
  playerId?: string;
  timestamp?: number;
}
