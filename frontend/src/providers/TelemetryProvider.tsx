import React, { createContext, useEffect, useMemo, useRef } from 'react';
import { telemetryService } from '../services/TelemetryService';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';

export const TelemetryContext = createContext<typeof telemetryService | null>(null);

interface TelemetryProviderProps {
  children: React.ReactNode;
}

export const TelemetryProvider: React.FC<TelemetryProviderProps> = ({ children }) => {
  const isInitializedRef = useRef(false);

  const telemetryConfig = useMemo(() => {
    const defaultDid = localStorage.getItem('deviceId') || 'anonymous-device';
    const defaultUid = userAuthInfoService.getUserId() || 'anonymous';
    const defaultSid = sessionStorage.getItem('sid') || `session-${Date.now()}`;
    const channel = import.meta.env.VITE_APP_CHANNEL || 'default';

    // Detect device type to match context.cdata "Device" entry in Sunbird telemetry spec
    const deviceType = /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';

    return {
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
      // tags: [channel] matches the sample IMPRESSION structure
      tags: [channel],
      // cdata: UserSession + Device entries match the sample context.cdata
      cdata: [
        { id: defaultSid, type: 'UserSession' },
        { id: deviceType, type: 'Device' }
      ],
      // rollup.l1 = channel matches the sample context.rollup
      rollup: { l1: channel },
      // The @project-sunbird/telemetry-sdk validates every event against standard schemas when true.
      // Controlled via .env.development (true) / .env.production (false).
      enableValidation: import.meta.env.VITE_ENABLE_TELEMETRY_VALIDATION === 'true'
    };
  }, []); 
  useEffect(() => {
    if (!sessionStorage.getItem('sid')) {
      sessionStorage.setItem('sid', telemetryConfig.sid);
    }
  }, [telemetryConfig.sid]);

  useEffect(() => {
    if (telemetryConfig && !isInitializedRef.current && !telemetryService.isInitialized) {
      telemetryService.initialize(telemetryConfig);
      telemetryService.start(
        telemetryConfig,
        'app',           // contentId (or some default value)
        '1.0',           // contentVer
        { type: 'app', mode: 'play', pageid: 'home' } // data
      );
      isInitializedRef.current = true;
    }
  }, [telemetryConfig]);

  useEffect(() => {
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

    // Use capture phase to ensure it catches even if propagation is stopped in React
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
