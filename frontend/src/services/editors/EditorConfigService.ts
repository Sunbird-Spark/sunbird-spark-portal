import userAuthInfoService from '../userAuthInfoService/userAuthInfoService';
import appCoreService from '../AppCoreService';
import { OrganizationService } from '../OrganizationService';
import { ChannelService } from '../ChannelService';
import userProfileService from '../UserProfileService';

export interface EditorBaseContext {
  sid: string;
  uid: string;
  did: string;
  channel: string;
  pdata: any;
}

export interface EditorChannelData {
  channelData: Record<string, any>;
  framework: string;
}

export class EditorConfigService {
  private orgService = new OrganizationService();
  private channelService = new ChannelService();

  async fetchBaseContext(): Promise<EditorBaseContext> {
    const sid = userAuthInfoService.getSessionId() || '';
    const uid = userAuthInfoService.getUserId() || 'anonymous';

    let did = '';
    try {
      did = await appCoreService.getDeviceId();
    } catch (error) {
      console.warn('Failed to fetch device ID:', error);
    }

    let channel = '';
    try {
      const filters: Record<string, any> = { isTenant: true };
      const userChannel = await userProfileService.getChannel();
      if (userChannel) filters.slug = userChannel;
      const orgResponse = await this.orgService.search({ filters });
      const org = orgResponse?.data?.response?.content?.[0];
      if (org) channel = org.hashTagId || org.identifier;
    } catch (error) {
      console.warn('Failed to fetch channel info:', error);
    }

    let pdata: any = {};
    try {
      pdata = await appCoreService.getPData();
    } catch {
      console.warn('Failed to fetch pdata');
    }

    return { sid, uid, did, channel, pdata };
  }

  async fetchChannelData(channel: string): Promise<EditorChannelData> {
    let channelData: Record<string, any> = {};
    let framework = '';
    try {
      const channelResponse = await this.channelService.read(channel);
      channelData = (channelResponse as any)?.data?.channel || {};
      const frameworks = channelData?.frameworks;
      if (Array.isArray(frameworks) && frameworks.length > 0) {
        framework = frameworks[0]?.identifier || '';
      }
    } catch (error) {
      console.warn('Failed to fetch channel framework:', error);
    }
    return { channelData, framework };
  }
}

export const editorConfigService = new EditorConfigService();
export default editorConfigService;
