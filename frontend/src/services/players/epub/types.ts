import type { TelemetryContext } from '../telemetryContextBuilder';

export interface EpubPlayerContextProps {
  mode?: string;
  cdata?: any[];
  contextRollup?: Record<string, string>;
  objectRollup?: Record<string, string>;
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
  context: TelemetryContext;
  config: Record<string, any>;
  metadata: EpubPlayerMetadata;
}

export interface EpubPlayerEvent {
  type: string;
  data: any;
  playerId?: string;
  timestamp?: number;
}
