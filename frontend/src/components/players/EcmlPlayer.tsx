import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { EcmlPlayerService } from '../../services/players/ecml';
import type { EcmlPlayerEvent, EcmlPlayerContextProps, EcmlPlayerMetadata } from '../../services/players/ecml';

interface EcmlPlayerProps {
  metadata: EcmlPlayerMetadata;
  mode?: string;
  cdata?: any[];
  contextRollup?: { l1: string };
  objectRollup?: Record<string, any>;
  onPlayerEvent?: (event: EcmlPlayerEvent) => void;
  onTelemetryEvent?: (event: any) => void;
}

export const EcmlPlayer: React.FC<EcmlPlayerProps> = ({
  metadata,
  mode,
  cdata,
  contextRollup,
  objectRollup,
  onPlayerEvent,
  onTelemetryEvent,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const serviceRef = useRef<EcmlPlayerService>(new EcmlPlayerService());

  const contextProps = useMemo<EcmlPlayerContextProps | undefined>(() => {
    if (mode === undefined && cdata === undefined && contextRollup === undefined && objectRollup === undefined) {
      return undefined;
    }
    return {
      ...(mode !== undefined && { mode }),
      ...(cdata !== undefined && { cdata }),
      ...(contextRollup !== undefined && { contextRollup }),
      ...(objectRollup !== undefined && { objectRollup }),
    };
  }, [mode, cdata, contextRollup, objectRollup]);

  const handlePlayerEvent = useCallback((event: EcmlPlayerEvent) => {
    onPlayerEvent?.(event);
  }, [onPlayerEvent]);

  const handleTelemetryEvent = useCallback((event: any) => {
    onTelemetryEvent?.(event);
  }, [onTelemetryEvent]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const service = serviceRef.current;
    let cancelled = false;

    const messageHandler = (event: MessageEvent) => {
      if (!event.data) return;

      const eventData = typeof event.data === 'string' ? (() => { try { return JSON.parse(event.data); } catch { return null; } })() : event.data;
      if (!eventData) return;

      const playerEvent: EcmlPlayerEvent = {
        type: eventData.eid || eventData.event || 'unknown',
        data: eventData,
        playerId: metadata.identifier,
        timestamp: Date.now(),
      };

      handlePlayerEvent(playerEvent);

      if (eventData.eid) {
        handleTelemetryEvent(eventData);
      }
    };

    const initPlayer = async () => {
      try {
        const config = await service.createConfig(metadata, contextProps);
        if (cancelled) return;

        const playerUrl = service.buildPlayerUrl();
        iframe.src = playerUrl;

        iframe.onload = () => {
          if (cancelled) return;
          try {
            const contentWindow = iframe.contentWindow as any;
            if (contentWindow && contentWindow.initializePreview) {
              contentWindow.initializePreview(config);
            }
          } catch (error) {
            console.error('Failed to initialize ECML preview:', error);
          }
        };

        window.addEventListener('message', messageHandler);
      } catch (error) {
        console.error('Failed to initialize ECML player:', error);
      }
    };

    initPlayer();

    return () => {
      cancelled = true;
      window.removeEventListener('message', messageHandler);
      if (iframe) {
        iframe.onload = null;
      }
    };
  }, [metadata, contextProps, handlePlayerEvent, handleTelemetryEvent]);

  return (
    <iframe
      ref={iframeRef}
      id="contentPlayer"
      name="contentPlayer"
      className="w-full h-full min-h-[600px] border-0"
      title="Content Player"
      aria-label="Content Player"
      allow="autoplay"
    />
  );
};
