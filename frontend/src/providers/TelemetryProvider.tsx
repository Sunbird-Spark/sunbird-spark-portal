import React, { createContext, useEffect, useRef } from 'react';
import { ITelemetryService, telemetryService } from '../services/TelemetryService';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import appCoreService from '@/services/AppCoreService';
import userProfileService from '@/services/UserProfileService';
import { OrganizationService } from '@/services/OrganizationService';
import { SystemSettingService } from '@/services/SystemSettingService';

export const TelemetryContext = createContext<ITelemetryService | null>(null);

interface TelemetryProviderProps {
  children: React.ReactNode;
}

function getDateDiff(serverDate?: unknown): number {
  if (!serverDate || typeof serverDate !== 'string') return 0;
  return (new Date(serverDate).getTime() - new Date().getTime()) / 1000;
}

export const TelemetryProvider: React.FC<TelemetryProviderProps> = ({ children }) => {
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current || telemetryService.isInitialized) return;

    const init = async () => {
      try {
        const orgService = new OrganizationService();
        const systemSettingService = new SystemSettingService();

        // pdata and device ID — fetch in parallel
        const [pdata, did] = await Promise.all([
          appCoreService.getPData().catch(() => ({ id: 'sunbird.portal', ver: '1.0.0', pid: 'sunbird-portal' })),
          appCoreService.getDeviceId().catch(() => ''),
        ]);

        // Session and identity — already populated by auth bootstrap
        const sid = userAuthInfoService.getSessionId() || `session-${Date.now()}`;
        const uid = userAuthInfoService.getUserId() || 'anonymous';
        const isLoggedIn = uid !== 'anonymous';

        let channel = '';
        let timeDiff = 0;

        if (isLoggedIn) {
          // Logged-in: channel from user profile (rootOrg channel), matching SunbirdEd-portal
          try {
            channel = await userProfileService.getChannel();
          } catch (e) {
            console.warn('[TelemetryProvider] Failed to get user channel', e);
          }
          // Compute server clock skew from org API response header
          if (channel) {
            try {
              const orgResponse = await orgService.search({ filters: { isTenant: true, slug: channel } });
              timeDiff = getDateDiff(orgResponse?.headers?.['date']);
            } catch (e) {
              console.warn('[TelemetryProvider] Failed to get org timeDiff', e);
            }
          }
        } else {
          // Anonymous: resolve channel from system default_channel setting → org hashTagId
          let slug = 'sunbird';
          try {
            const setting = await systemSettingService.read<{ response: { value: string } }>('default_channel');
            slug = (setting as any)?.data?.response?.value || slug;
          } catch (e) {
            console.warn('[TelemetryProvider] Failed to read default_channel', e);
          }
          try {
            const orgResponse = await orgService.search({ filters: { isTenant: true, slug } });
            const org = orgResponse?.data?.response?.content?.[0];
            channel = org?.hashTagId || org?.channel || '';
            timeDiff = getDateDiff(orgResponse?.headers?.['date']);
          } catch (e) {
            console.warn('[TelemetryProvider] Failed to fetch org for anonymous user', e);
          }
        }

        const deviceType = /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';

        const telemetryConfig = {
          pdata,
          env: 'home',
          channel,
          did,
          uid,
          sid,
          batchsize: 20,
          host: '',
          endpoint: '/action/data/v3/telemetry',
          tags: channel ? [channel] : [],
          cdata: [
            { id: sid, type: 'UserSession' },
            { id: deviceType, type: 'Device' },
          ],
          rollup: channel ? { l1: channel } : {},
          timeDiff,
          enableValidation: false,
        };

        telemetryService.initialize(telemetryConfig);
        isInitializedRef.current = true;

        // Fire global session END when the user closes or navigates away from the portal
        const handleUnload = () => {
          telemetryService.end({
            edata: { type: 'app', pageid: 'home', mode: 'play' },
          });
        };
        window.addEventListener('beforeunload', handleUnload);
      } catch (e) {
        console.error('[TelemetryProvider] Failed to initialize telemetry', e);
      }
    };

    init();
  }, []);

  // Global INTERACT listener — picks up any element with data-edataid attribute
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('[data-edataid]') as HTMLElement;
      if (!target) return;

      const edataid = target.getAttribute('data-edataid');
      if (!edataid) return;

      const edatatype = target.getAttribute('data-edatatype') || 'CLICK';
      const pageid = target.getAttribute('data-pageid');

      const payload: any = {
        edata: { id: edataid, type: edatatype },
      };

      if (pageid) payload.edata.pageid = pageid;

      const cdataStr = target.getAttribute('data-cdata');
      if (cdataStr) {
        try {
          payload.options = { context: { cdata: JSON.parse(cdataStr) } };
        } catch (e) {
          console.error('[TelemetryProvider] Failed to parse data-cdata', e);
        }
      } else {
        const objectid = target.getAttribute('data-objectid') || target.getAttribute('data-objid');
        const objecttype = target.getAttribute('data-objecttype') || target.getAttribute('data-objtype');
        if (objectid && objecttype) {
          payload.options = { context: { cdata: [{ id: objectid, type: objecttype }] } };
        }
      }

      telemetryService.interact(payload);
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, []);

  return (
    <TelemetryContext.Provider value={telemetryService}>
      {children}
    </TelemetryContext.Provider>
  );
};
