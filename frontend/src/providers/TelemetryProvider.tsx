import React, { createContext, useEffect, useMemo } from 'react';
import { telemetryService } from '../services/TelemetryService';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';

export const TelemetryContext = createContext<typeof telemetryService | null>(null);

interface TelemetryProviderProps {
  children: React.ReactNode;
}

export const TelemetryProvider: React.FC<TelemetryProviderProps> = ({ children }) => {
  const telemetryConfig = useMemo(() => {
    const defaultDid = localStorage.getItem('deviceId') || 'anonymous-device';
    const defaultUid = userAuthInfoService.getUserId() || 'anonymous';
    const defaultSid = sessionStorage.getItem('sid') || `session-${Date.now()}`;
    
    if (!sessionStorage.getItem('sid')) {
        sessionStorage.setItem('sid', defaultSid);
    }

    return {
      pdata: {
        id: import.meta.env.VITE_APP_ID || 'sunbird.portal',
        ver: import.meta.env.VITE_APP_VERSION || '1.0.0',
        pid: 'sunbird-portal'
      },
      env: import.meta.env.VITE_APP_ENV || 'production',
      channel: import.meta.env.VITE_APP_CHANNEL || 'default',
      did: defaultDid,
      authtoken: '',
      uid: defaultUid,
      sid: defaultSid,
      batchsize: 1, // Set to higher in prod, kept 1 for debugging
      host: window.location.origin,
      endpoint: '/action/data/v3/telemetry',
      tags: [],
      cdata: []
    };
  }, []); 
  // do not fire telemetry events before the service is initialized.
  // do not fire telemetry events before the service is initialized.
  if (telemetryConfig && !telemetryService.isInitialized) {
    telemetryService.initialize(telemetryConfig);
    telemetryService.start(
      telemetryConfig,
      'app',           // contentId (or some default value)
      '1.0',           // contentVer
      { type: 'app', mode: 'play', pageid: 'home' } // data
    );
  }

  useEffect(() => {
     // Handle dynamic config updates when user context changes
     if (telemetryConfig && !telemetryService.isInitialized) {
        telemetryService.initialize(telemetryConfig);
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
          payload.context = { cdata: JSON.parse(cdataStr) };
        } catch (e) {
          console.error('Failed to parse telemetry cdata', e);
        }
      } else {
        const objectid = target.getAttribute('data-objectid');
        const objecttype = target.getAttribute('data-objecttype');
        if (objectid && objecttype) {
          payload.context = { cdata: [{ id: objectid, type: objecttype }] };
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
