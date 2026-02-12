import { v4 as uuidv4 } from 'uuid';

export interface PlayerConfig {
  context: Record<string, any>;
  config: Record<string, any>;
  metadata: any;
  data: any;
}

export interface BuildPlayerConfigInput {
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

const baseTemplate: PlayerConfig = {
  context: {
    mode: 'play',
    pdata: {
      id: 'sunbird.portal',
      ver: '3.2.12',
      pid: 'sunbird-portal.contentplayer'
    }
  },
  config: {},
  metadata: {},
  data: {}
};

function majorMinor(version?: string) {
  if (!version) return '1.0';
  const parts = version.split('.');
  return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : version;
}

export function buildPlayerConfig(input: BuildPlayerConfigInput): PlayerConfig {
  const {
    metadata,
    user,
    orgChannel,
    deviceId,
    buildNumber,
    appId,
    pid,
    host,
    authToken,
    endpoint,
    env,
    dialCode,
    uid,
    enableTelemetryValidation,
    overrides
  } = input;

  const config: PlayerConfig = JSON.parse(JSON.stringify(baseTemplate));

  config.context.contentId = metadata?.identifier;
  config.context.identifier = metadata?.identifier;
  config.context.sid = uuidv4();
  config.context.uid = uid || user?.id || 'anonymous';
  config.context.timeDiff = 0;
  config.context.authToken = authToken || '';
  config.context.host = host || config.context.host || '';
  config.context.endpoint = endpoint || '';
  config.context.env = env || 'contentplayer';
  config.context.pdata.id = appId || config.context.pdata.id;
  config.context.pdata.pid = pid || config.context.pdata.pid;
  config.context.pdata.ver = majorMinor(buildNumber || config.context.pdata.ver);
  const channel = orgChannel || metadata?.channel;
  if (channel) {
    config.context.channel = channel;
    config.context.tags = [channel];
    config.context.dims = [channel, channel];
    config.context.app = [channel];
    config.context.contextRollup = { l1: channel };
  }
  if (deviceId) {
    config.context.did = deviceId;
  }
  if (dialCode) {
    config.context.cdata = [{ id: dialCode, type: 'DialCode' }];
  }

  config.metadata = metadata;
  config.data = metadata?.mimeType === 'application/vnd.ekstep.ecml-archive' ? metadata.body || {} : {};

  config.config = {
    ...config.config,
    traceId: uuidv4(),
    enableTelemetryValidation: enableTelemetryValidation ?? false
  };

  if (overrides?.context) {
    config.context = { ...config.context, ...overrides.context };
  }
  if (overrides?.config) {
    config.config = { ...config.config, ...overrides.config };
  }

  return config;
}