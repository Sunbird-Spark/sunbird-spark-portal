import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { VideoPlayerService } from '../../services/players/video';
import type { VideoPlayerEvent, VideoPlayerContextProps, VideoPlayerMetadata } from '../../services/players/video';

interface VideoPlayerProps {
  metadata: VideoPlayerMetadata; // Required - complete metadata object from backend
  mode?: string; // Optional - default: 'play'
  cdata?: any[]; // Optional - default: []
  contextRollup?: Record<string, string>; // Optional - default: { l1: channel }
  objectRollup?: Record<string, string>; // Optional - default: {}
  onPlayerEvent?: (event: VideoPlayerEvent) => void;
  onTelemetryEvent?: (event: any) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  metadata,
  mode,
  cdata,
  contextRollup,
  objectRollup,
  onPlayerEvent,
  onTelemetryEvent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<VideoPlayerService>(new VideoPlayerService());

  // Memoize context props to avoid recreating on every render
  const contextProps = useMemo<VideoPlayerContextProps | undefined>(() => {
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
  const handlePlayerEvent = useCallback((event: VideoPlayerEvent) => {
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
        console.log('Initializing video player with metadata:', {
          identifier: metadata.identifier,
          name: metadata.name,
          artifactUrl: metadata.artifactUrl,
        });

        const config = await service.createConfig(metadata, contextProps);

        if (cancelled) return;

        playerElement = await service.createElement(config);

        if (cancelled) return;
        service.attachEventListeners(playerElement, handlePlayerEvent, handleTelemetryEvent);

        if (containerRef.current) {
          containerRef.current.appendChild(playerElement);
          console.log('Video player element added to DOM');
        }
      } catch (error) {
        console.error('Failed to initialize video player:', error);
      }
    };

    initPlayer();

    return () => {
      cancelled = true;
      if (playerElement) {
        service.removeEventListeners(playerElement);
        playerElement.remove();
      }
    };
  }, [metadata, contextProps, handlePlayerEvent, handleTelemetryEvent]);

  return (
    <div ref={containerRef} className="content-player-embed" />
  );
};
