export interface EpubPlayerConfig {
  context: any;
  config?: any;
  metadata?: any;
}

export interface EpubPlayerEvent {
  type: string;
  data: any;
  playerId?: string;
  timestamp?: number;
}
