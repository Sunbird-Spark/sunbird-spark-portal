import React, { createContext, useEffect, useMemo, useRef } from 'react';
import { telemetryService } from '../services/TelemetryService';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';

export const TelemetryContext = createContext<typeof telemetryService | null>(null);

interface TelemetryProviderProps {
  children: React.ReactNode;
}

export const TelemetryProvider: React.FC<TelemetryProviderProps> = ({ children }) => {
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isInitializedRef.current && !telemetryService.isInitialized) {
      try {
        const defaultDid = localStorage.getItem('deviceId') || 'anonymous-device';
        let defaultUid = 'anonymous';
        try {
          defaultUid = userAuthInfoService.getUserId() || 'anonymous';
        } catch (e) {
          console.warn('Failed to read user id for telemetry config', e);
        }
        const defaultSid = sessionStorage.getItem('sid') || `session-${Date.now()}`;
        
        if (!sessionStorage.getItem('sid')) {
          sessionStorage.setItem('sid', defaultSid);
        }

        const channel = import.meta.env.VITE_APP_CHANNEL || 'default';
        const deviceType = /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';

        const telemetryConfig = {
          pdata: {
            id: import.meta.env.VITE_APP_ID || 'sunbird.portal',
            ver: import.meta.env.VITE_APP_VERSION || '1.0.0',
            pid: 'sunbird-portal'
          },
          env: import.meta.env.VITE_APP_ENV || 'production',
          channel,
          did: defaultDid,
          authtoken: '',
          uid: defaultUid,
          sid: defaultSid,
          batchsize: 20,
          host: window.location.origin,
          endpoint: '/action/data/v3/telemetry',
          tags: [channel],
          cdata: [
            { id: defaultSid, type: 'UserSession' },
            { id: deviceType, type: 'Device' }
          ],
          rollup: { l1: channel },
          enableValidation: import.meta.env.VITE_ENABLE_TELEMETRY_VALIDATION === 'true'
        };

        telemetryService.initialize(telemetryConfig);
        telemetryService.start(
          {},
          'app',
          '1.0',
          { type: 'app', mode: 'play', pageid: 'home' }
        );
        isInitializedRef.current = true;
      } catch (e) {
        console.error('[TelemetryProvider] Failed to initialize telemetry', e);
        return; // Do not attach click listener if init fails
      }
    }

    const handleGlobalClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest('[data-edataid]') as HTMLElement;
      if (!target) return;

      const edataid = target.getAttribute('data-edataid');
      const edatatype = target.getAttribute('data-edatatype') || 'CLICK';
      const pageid = target.getAttribute('data-pageid');
      
      if (!edataid) return;

      const payload: any = {
        edata: {
          id: edataid,
          type: edatatype,
        },
      };

      if (pageid) {
        payload.edata.pageid = pageid;
      }

      const cdataStr = target.getAttribute('data-cdata');
      if (cdataStr) {
        try {
          payload.options = { context: { cdata: JSON.parse(cdataStr) } };
        } catch (e) {
          console.error('Failed to parse telemetry cdata', e);
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

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);

  return (
    <TelemetryContext.Provider value={telemetryService}>
      {children}
    </TelemetryContext.Provider>
  );
};
