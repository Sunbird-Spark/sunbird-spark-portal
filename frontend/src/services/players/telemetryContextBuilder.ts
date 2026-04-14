import _ from 'lodash';
import userAuthInfoService from '../userAuthInfoService/userAuthInfoService';
import appCoreService from '../AppCoreService';
import { OrganizationService } from '../OrganizationService';
import userProfileService from '../UserProfileService';
import { SystemSettingService } from '../SystemSettingService';

/**
 * Telemetry path for editor & player iframes.
 * Iframes concatenate `apislug` + this value to build the request URL.
 * apislug=/action  =>  /action + /data/v3/telemetry = /action/data/v3/telemetry
 */
export const TELEMETRY_ENDPOINT = '/data/v3/telemetry';

/**
 * Full telemetry URL for the Sunbird JS SDK (TelemetryProvider).
 * The SDK calls fetch(host + endpoint) directly with no apislug prepending.
 */
export const TELEMETRY_SDK_ENDPOINT = '/action/data/v3/telemetry';

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
  timeDiff: number;
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
  const systemSettingService = new SystemSettingService();
  
  // Safely read default_channel with fallback to 'sunbird' if the call fails
  let slug = 'sunbird';
  try {
    const defaultChannel = await systemSettingService.read<{ response: { value: string } }>('default_channel');
    slug = defaultChannel?.data?.response?.value;
  } catch (error) {
    console.warn('Failed to read default_channel system setting, using fallback:', error);
  }

  // Identity
  const sid = userAuthInfoService.getSessionId() || `session-${Date.now()}`;
  const uid = userAuthInfoService.getUserId() || 'anonymous';

  // Device
  let did = '';
  try {
    did = await appCoreService.getDeviceId();
  } catch (error) {
    // Log and proceed with default `did` to avoid blocking player initialization on transient failures
    console.warn(
      'TelemetryContextBuilder: Failed to get device ID, proceeding with default value.',
      error
    );
  }

  // Organization / channel
  let channel = '';
  let hashTagId = '';
  let timeDiff = 0;
  try {
    const orgResponse = await orgService.search({ filters: { isTenant: true, slug: slug } });
    const org = orgResponse?.data?.response?.content?.[0];
    channel = org?.hashTagId || org?.channel || '';
    hashTagId = org?.hashTagId || '';
    // Compute clock skew from response Date header: (serverTime - clientTime) / 1000
    // Same as old portal's DataService.getDateDiff()
    timeDiff = getDateDiff(orgResponse?.headers?.['date'] as string);
  } catch (error) {
    // Log and proceed with default org/channel values
    console.warn(
      'TelemetryContextBuilder: Failed to fetch organization data, proceeding with default values.',
      error
    );
  }

  // Producer data
  const pdata = await appCoreService.getPData();

  // User data (only for logged-in users)
  let userData = { firstName: '', lastName: '' };
  let userHashTagIds: string[] = [];
  let userOrgHashTagIds: string[] = [];
  const isLoggedIn = uid !== 'anonymous';
  if (isLoggedIn) {
    try {
      userData = await userProfileService.getUserData();
      userHashTagIds = await userProfileService.getHashTagIds();
      userOrgHashTagIds = await userProfileService.getOrganisationHashTagIds();
    } catch (error) {
      console.warn(
      'TelemetryContextBuilder: Failed to fetch user profile data, proceeding with default values.',
      error
    );
    }
  }

  // contextRollup: logged-in → from user hashTagIds, anonymous → from org hashTagId
  const contextRollup = getRollUpData(isLoggedIn ? userHashTagIds : _.compact([hashTagId]));

  // Derived fields — for logged-in users, tags come from user profile organisations (old portal pattern)
  const tags = _.compact(
    isLoggedIn && !_.isEmpty(userOrgHashTagIds)
      ? userOrgHashTagIds
      : [hashTagId || channel]
  );

  // Use caller-provided cdata
  const cdata = contextProps?.cdata || [];

  // dims = tags + courseId + batchId (when playing content inside a course, matching old portal pattern)
  const courseEntry = _.find(cdata, { type: 'course' });
  const batchEntry = _.find(cdata, { type: 'batch' });
  const dims = [...tags];
  if (courseEntry?.id) dims.push(courseEntry.id);
  if (batchEntry?.id) dims.push(batchEntry.id);

  const context: TelemetryContext = {
    mode: contextProps?.mode || 'play',
    sid,
    did,
    uid,
    channel,
    pdata,
    contextRollup: contextProps?.contextRollup || contextRollup,
    tags,
    cdata,
    timeDiff,
    objectRollup: contextProps?.objectRollup || {},
    host: '',
    endpoint: TELEMETRY_ENDPOINT,
    dims,
    app: channel ? [channel] : [],
    partner: [],
    userData,
  };

  if (options?.contentId) {
    context.contentId = options.contentId;
  }

  return context;
}

/**
 * Compute clock skew between server and client in seconds.
 * Same as old portal's DataService.getDateDiff().
 */
function getDateDiff(serverDate?: string): number {
  if (!serverDate) return 0;
  const serverTime = new Date(serverDate).getTime();
  const clientTime = new Date().getTime();
  return (serverTime - clientTime) / 1000;
}

/**
 * Convert an array of IDs into a rollup object {l1: id1, l2: id2, ...}
 * Same as old portal's getRollUpData().
 */
function getRollUpData(data: string[] = []): Record<string, string> {
  const rollUp: Record<string, string> = {};
  data.forEach((element, index) => { rollUp[`l${index + 1}`] = element; });
  return rollUp;
}
