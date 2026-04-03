import type { TelemetryContext } from '../telemetryContextBuilder';

export interface EcmlPlayerContextProps {
  mode?: string;
  cdata?: any[];
  contextRollup?: Record<string, string>;
  objectRollup?: Record<string, string>;
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
  context: TelemetryContext;
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
    enableTelemetryValidation: boolean;
    build_number?: string;
  };
  metadata: EcmlPlayerMetadata;
  data: Record<string, any>;
}

export interface EcmlPlayerEvent {
  type: string;
  data: any;
  playerId?: string;
  timestamp?: number;
}
