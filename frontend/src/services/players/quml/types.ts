export interface QumlPlayerConfig {
  context: Record<string, any>;
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
  contextRollup?: { l1: string };
  objectRollup?: Record<string, any>;
}
