export interface EpubPlayerContextProps {
  mode?: string;
  cdata?: any[];
  contextRollup?: {
    l1: string;
  };
  objectRollup?: Record<string, any>;
}

export interface EpubPlayerMetadata {
  identifier: string;
  name: string;
  artifactUrl: string;
  streamingUrl?: string;
  compatibilityLevel?: number;
  pkgVersion?: number;
  [key: string]: any;
}

export interface EpubPlayerConfig {
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
  };
  config: Record<string, any>;
  metadata: EpubPlayerMetadata;
}

export interface EpubPlayerEvent {
  type: string;
  data: any;
  playerId?: string;
  timestamp?: number;
}
