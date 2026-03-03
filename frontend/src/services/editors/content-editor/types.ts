export interface ContentEditorMetadata {
  identifier: string;
  name: string;
  mimeType?: string;
  contentType?: string;
  framework?: string;
  primaryCategory?: string;
  [key: string]: any;
}

export interface ContentEditorWindowContext {
  user: {
    id: string;
    name: string;
    orgIds: string[];
    organisations: Record<string, any>;
  };
  sid: string | null;
  contentId: string;
  pdata: {
    id: string;
    ver: string;
    pid: string;
  };
  channel: string;
  framework: string;
  ownershipType?: string[];
  uid: string;
  did: string;
  defaultLicense?: string;
  contextRollup: { l1: string };
  tags: string[];
  timeDiff?: number;
}

export interface ContentEditorWindowConfig {
  baseURL: string;
  apislug: string;
  build_number: string;
  pluginRepo: string;
  aws_s3_urls: string[];
  plugins: Array<{ id: string; ver: string; type: string }>;
  corePluginsPackaged: boolean;
  dispatcher: string;
  localDispatcherEndpoint: string;
  modalId: string;
  alertOnUnload: boolean;
  headerLogo: string;
  showHelp: boolean;
  previewConfig: {
    repos: string[];
    plugins: Array<{ id: string; ver: string; type: string }>;
    splash: {
      text: string;
      icon: string;
      bgImage: string;
      webLink: string;
    };
    showEndPage: boolean;
    showStartPage?: boolean;
  };
  enableTelemetryValidation: boolean;
  cloudStorage: {
    provider?: string;
  };
}

export interface ContentEditorConfig {
  context: ContentEditorWindowContext;
  config: ContentEditorWindowConfig;
}

export interface ContentEditorEvent {
  type: string;
  data: any;
  contentId?: string;
  timestamp?: number;
}
