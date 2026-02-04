// PDF-focused player service types
export interface PdfPlayerConfig {
  contentId: string;
  contentName: string;
  contentUrl: string;
  userId?: string;
  userToken?: string;
  streamingUrl?: string;
  compatibilityLevel?: number;
  pkgVersion?: number;
  isAvailableLocally?: boolean;
  basePath?: string;
  baseDir?: string;
}

export interface PdfPlayerOptions {
  showShare?: boolean;
  showDownload?: boolean;
  showPrint?: boolean;
  showReplay?: boolean;
  showExit?: boolean;
}

export interface PdfPlayerEvent {
  type: string;
  playerId: string;
  timestamp: number;
  [key: string]: any;
}

export interface PdfTelemetryEvent {
  eid: string;
  playerId: string;
  timestamp: number;
  [key: string]: any;
}