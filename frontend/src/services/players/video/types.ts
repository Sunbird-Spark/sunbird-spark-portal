import type { TelemetryContext } from '../telemetryContextBuilder';

export interface VideoPlayerContextProps {
  mode?: string;
  cdata?: any[];
  contextRollup?: Record<string, string>;
  objectRollup?: Record<string, string>;
}

export interface VideoPlayerMetadata {
  identifier: string;
  name: string;
  artifactUrl: string;
  streamingUrl?: string;
  compatibilityLevel?: number;
  pkgVersion?: number;
  [key: string]: any;
}

export interface VideoPlayerConfig {
  context: TelemetryContext;
  config: Record<string, any>;
  metadata: VideoPlayerMetadata;
}

export interface VideoPlayerEvent {
  type: string;
  data: any;
  playerId?: string;
  timestamp?: number;
}
