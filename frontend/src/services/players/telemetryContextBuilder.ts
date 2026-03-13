import userAuthInfoService from '../userAuthInfoService/userAuthInfoService';
import appCoreService from '../AppCoreService';
import { OrganizationService } from '../OrganizationService';
import userProfileService from '../UserProfileService';

export interface TelemetryContextProps {
  mode?: string;
  cdata?: any[];
  contextRollup?: Record<string, string>;
  objectRollup?: Record<string, string>;
}

export interface TelemetryContext {
  mode: string;
  sid: string | null;
  did: string;
  uid: string;
  channel: string;
  pdata: { id: string; ver: string; pid: string };
  contextRollup: Record<string, string>;
  tags: string[];
  cdata: any[];
  timeDiff: string | number;
  objectRollup: Record<string, string>;
  host: string;
  endpoint: string;
  dims: string[];
  app: string[];
  partner: any[];
  userData: { firstName: string; lastName: string };
  contentId?: string;
}

/**
 * Build the telemetry context object shared by all player services.
 * Fetches identity, device, org, and user data from the respective singletons
 * and merges caller-provided overrides via contextProps.
 */
export async function buildTelemetryContext(
  contextProps?: TelemetryContextProps,
  options?: { contentId?: string }
): Promise<TelemetryContext> {
  const orgService = new OrganizationService();

  // Identity
  const sid = userAuthInfoService.getSessionId() || `session-${Date.now()}`;
  const uid = userAuthInfoService.getUserId() || 'anonymous';

  // Device
  let did = '';
  try {
    did = await appCoreService.getDeviceId();
  } catch {
    // device ID generation may fail; leave empty
  }

  // Organization / channel
  let channel = '';
  let hashTagId = '';
  let timeDiff = 0;
  try {
    const orgResponse = await orgService.search({ filters: { isTenant: true } });
    const org = orgResponse?.data?.result?.response?.content?.[0];
    if (org?.channel) channel = org.channel;
    if (org?.hashTagId) hashTagId = org.hashTagId;
    if (orgResponse?.data?.ts) timeDiff = orgResponse.data.ts;
    
  } catch {
    // org service may be unavailable
  }

  // Producer data
  const pdata = await appCoreService.getPData();

  // User data
  let userData = { firstName: '', lastName: '' };
  try {
    userData = await userProfileService.getUserData();
  } catch {
    // user profile may be unavailable for anonymous users
  }

  // Derived fields
  const tags = hashTagId ? [hashTagId] : channel ? [channel] : [];

  // Use caller-provided cdata
  const cdata = contextProps?.cdata || [];

  const context: TelemetryContext = {
    mode: contextProps?.mode || 'play',
    sid,
    did,
    uid,
    channel,
    pdata,
    contextRollup: contextProps?.contextRollup || { l1: channel },
    tags,
    cdata,
    timeDiff,
    objectRollup: contextProps?.objectRollup || {},
    host: '',
    endpoint: '/portal/data/v1/telemetry',
    dims: tags,
    app: channel ? [channel] : [],
    partner: [],
    userData,
  };

  if (options?.contentId) {
    context.contentId = options.contentId;
  }

  return context;
}
