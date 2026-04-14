import type { TelemetryContext } from '../telemetryContextBuilder';

export interface QumlPlayerConfig {
  context: TelemetryContext;
  config: Record<string, any>;
  metadata: any;
}

export interface QumlPlayerMetadata {
  identifier: string;
  name: string;
  mimeType: string;
  channel?: string;
  createdBy?: string;
  [key: string]: any;
}

export interface QumlPlayerEvent {
  type: string;
  data: any;
  playerId: string;
  timestamp: number;
}

export interface QumlPlayerContextProps {
  mode?: string;
  cdata?: any[];
  contextRollup?: Record<string, string>;
  objectRollup?: Record<string, string>;
}
