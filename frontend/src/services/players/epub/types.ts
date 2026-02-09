export interface EpubPlayerConfig {
  context: {
    mode: string;
    partner: any[];
    pdata: {
      id: string;
      ver: string;
      pid: string;
    };
    contentId: string;
    sid: string;
    uid: string;
    timeDiff: number;
    channel: string;
    tags: any[];
    did: string;
    contextRollup: any;
    objectRollup: any;
    host: string;
    endpoint: string;
  };
  config: {
    sideMenu: {
      showShare: boolean;
      showDownload: boolean;
      showReplay: boolean;
      showExit: boolean;
    };
  };
  metadata: {
    identifier: string;
    name: string;
    artifactUrl: string;
    streamingUrl: string;
    compatibilityLevel: number;
    pkgVersion: number;
  };
}

export interface EpubPlayerEvent {
  type: string;
  data: any;
  playerId?: string;
  timestamp?: number;
}
