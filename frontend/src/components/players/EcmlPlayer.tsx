import React, { useEffect, useRef, useMemo } from 'react';
import { EcmlPlayerService } from '../../services/players/ecml';
import type { EcmlPlayerEvent, EcmlPlayerContextProps, EcmlPlayerMetadata } from '../../services/players/ecml';

interface EcmlPlayerProps {
  metadata: EcmlPlayerMetadata;
  mode?: string;
  cdata?: any[];
  contextRollup?: Record<string, string>;
  objectRollup?: Record<string, string>;
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

  // Store event handlers in refs so the player-init useEffect only re-runs
  // when metadata/contextProps genuinely change, not when callback identities
  // shift due to upstream re-renders (e.g. after content state updates).
  const onPlayerEventRef = useRef(onPlayerEvent);
  useEffect(() => { onPlayerEventRef.current = onPlayerEvent; }, [onPlayerEvent]);
  const onTelemetryEventRef = useRef(onTelemetryEvent);
  useEffect(() => { onTelemetryEventRef.current = onTelemetryEvent; }, [onTelemetryEvent]);

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

      onPlayerEventRef.current?.(playerEvent);

      if (eventData.eid) {
        onTelemetryEventRef.current?.(eventData);
      }
    };

    /**
     * The ECML player's iframeEvent plugin dispatches telemetry events as
     * CustomEvents named "renderer:telemetry:event" on the parent document's
     * iframe element (via window.parent.document.getElementById('contentPlayer').dispatchEvent).
     * We must listen for these on the iframe element itself, not on window.
     */
    const telemetryCustomEventHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventData = customEvent.detail;
      if (!eventData) return;

      const telemetryData = eventData.telemetryData ?? eventData;

      const playerEvent: EcmlPlayerEvent = {
        type: telemetryData.eid || telemetryData.event || 'unknown',
        data: telemetryData,
        playerId: metadata.identifier,
        timestamp: Date.now(),
      };

      onPlayerEventRef.current?.(playerEvent);

      if (telemetryData.eid) {
        onTelemetryEventRef.current?.(telemetryData);
      }
    };

    // Register CustomEvent listener on the iframe element BEFORE player init
    // to avoid missing the START event fired immediately on initialization.
    iframe.addEventListener('renderer:telemetry:event', telemetryCustomEventHandler);

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
      iframe.removeEventListener('renderer:telemetry:event', telemetryCustomEventHandler);
      if (iframe) {
        iframe.onload = null;
      }
    };
  }, [metadata, contextProps]);

  return (
    <iframe
      ref={iframeRef}
      id="contentPlayer"
      name="contentPlayer"
      className="content-player-embed border-0"
      title="Content Player"
      aria-label="Content Player"
      allow="autoplay"
    />
  );
};
