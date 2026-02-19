import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { EpubPlayerService } from '../../services/players/epub';
import type { EpubPlayerEvent, EpubPlayerContextProps, EpubPlayerMetadata } from '../../services/players/epub';

interface EpubPlayerProps {
  metadata: EpubPlayerMetadata; // Required - complete metadata object from backend
  mode?: string; // Optional - default: 'play'
  cdata?: any[]; // Optional - default: []
  contextRollup?: { l1: string }; // Optional - default: { l1: channel }
  objectRollup?: Record<string, any>; // Optional - default: {}
  onPlayerEvent?: (event: EpubPlayerEvent) => void;
  onTelemetryEvent?: (event: any) => void;
}


export const EpubPlayer: React.FC<EpubPlayerProps> = ({
  metadata,
  mode,
  cdata,
  contextRollup,
  objectRollup,
  onPlayerEvent,
  onTelemetryEvent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<EpubPlayerService>(new EpubPlayerService());

  // Memoize context props to avoid recreating on every render
  const contextProps = useMemo<EpubPlayerContextProps | undefined>(() => {
    // Only create contextProps if at least one optional param is provided
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

  // Memoize event handlers to maintain referential equality
  const handlePlayerEvent = useCallback((event: EpubPlayerEvent) => {
    onPlayerEvent?.(event);
  }, [onPlayerEvent]);

  const handleTelemetryEvent = useCallback((event: any) => {
    onTelemetryEvent?.(event);
  }, [onTelemetryEvent]);

  useEffect(() => {
    if (!containerRef.current) return;

    const service = serviceRef.current;
    let playerElement: HTMLElement | null = null;
    let cancelled = false;

    const initPlayer = async () => {
      try {
        const config = await service.createConfig(metadata, contextProps);
        
        if (cancelled) return;

        playerElement = service.createElement(config);
        service.attachEventListeners(playerElement, handlePlayerEvent, handleTelemetryEvent);
        
        if (containerRef.current) {
          containerRef.current.appendChild(playerElement);
        }
      } catch (error) {
        console.error('Failed to initialize EPUB player:', error);
      }
    };

    initPlayer();

    return () => {
      cancelled = true;
      if (playerElement) {
        service.removeEventListeners(playerElement);
        playerElement.remove();
      }
      EpubPlayerService.unloadStyles();
    };
  }, [metadata, contextProps, handlePlayerEvent, handleTelemetryEvent]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[37.5rem] relative"
      
    />
  );
};
