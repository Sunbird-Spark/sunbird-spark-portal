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
    sid: string | null;
    did: string;
    uid: string;
    channel: string;
    pdata: {
      id: string;
      ver: string;
      pid: string;
    };
    contextRollup: any;
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
  config: Record<string, any>;
  metadata: EpubPlayerMetadata;
}

export interface EpubPlayerEvent {
  type: string;
  data: any;
  playerId?: string;
  timestamp?: number;
}
