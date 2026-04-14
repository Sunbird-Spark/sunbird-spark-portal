import type { TelemetryContext } from '../telemetryContextBuilder';

export interface PdfPlayerContextProps {
  mode?: string;
  cdata?: any[];
  contextRollup?: Record<string, string>;
  objectRollup?: Record<string, string>;
}

export interface PdfPlayerMetadata {
  identifier: string;
  name: string;
  artifactUrl: string;
  streamingUrl?: string;
  compatibilityLevel?: number;
  pkgVersion?: number;
  [key: string]: any;
}

export interface PdfPlayerConfig {
  context: TelemetryContext;
  config: Record<string, any>;
  metadata: PdfPlayerMetadata;
}

export interface PdfPlayerEvent {
  type: string;
  data: any;
  playerId?: string;
  timestamp?: number;
}
