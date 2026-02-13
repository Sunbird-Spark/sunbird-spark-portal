export interface QumlPlayerConfig {
  context: Record<string, any>;
  config: Record<string, any>;
  metadata: any;
  data: any;
}

export interface BuildQumlPlayerConfigInput {
  metadata: any;
  user?: { id?: string; firstName?: string; lastName?: string };
  orgChannel?: string;
  deviceId?: string;
  buildNumber?: string;
  appId?: string;
  pid?: string;
  host?: string;
  authToken?: string;
  endpoint?: string;
  env?: string;
  dialCode?: string;
  uid?: string;
  enableTelemetryValidation?: boolean;
  overrides?: {
    context?: Record<string, any>;
    config?: Record<string, any>;
  };
}
