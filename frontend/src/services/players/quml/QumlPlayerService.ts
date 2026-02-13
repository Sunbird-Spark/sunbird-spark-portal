import { v4 as uuidv4 } from 'uuid';
import type { QumlPlayerConfig, BuildQumlPlayerConfigInput } from './types';

export function buildQumlPlayerConfig(input: BuildQumlPlayerConfigInput): QumlPlayerConfig {
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
    overrides,
  } = input;

  const baseTemplate: QumlPlayerConfig = {
    context: {
      mode: 'play',
      pdata: {
        id: 'sunbird.portal',
        ver: '3.2.12',
        pid: 'sunbird-portal.contentplayer',
      },
    },
    config: {},
    metadata: {},
    data: {},
  };

  const config: QumlPlayerConfig = JSON.parse(JSON.stringify(baseTemplate));

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
  config.context.pdata.ver = buildNumber
    ? majorMinor(buildNumber)
    : majorMinor(config.context.pdata.ver);

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
  config.data =
    metadata?.mimeType === 'application/vnd.ekstep.ecml-archive' ? metadata.body || {} : {};

  config.config = {
    ...config.config,
    traceId: uuidv4(),
    enableTelemetryValidation: enableTelemetryValidation ?? false,
  };

  if (overrides?.context) {
    config.context = { ...config.context, ...overrides.context };
  }
  if (overrides?.config) {
    config.config = { ...config.config, ...overrides.config };
  }

  return config;
}

function majorMinor(version?: string) {
  if (!version) return '1.0';
  const parts = version.split('.');
  return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : version;
}

export class QumlPlayerService {
  buildConfig(input: BuildQumlPlayerConfigInput): QumlPlayerConfig {
    return buildQumlPlayerConfig(input);
  }
}

export const qumlPlayerService = new QumlPlayerService();
