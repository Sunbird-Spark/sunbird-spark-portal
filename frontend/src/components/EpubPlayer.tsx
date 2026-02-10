import React, { useEffect, useRef, useState } from 'react';
import { EpubPlayerService } from '../services/players/epub';
import type { EpubPlayerConfig, EpubPlayerEvent } from '../services/players/epub';

interface EpubPlayerProps {
  context: any;
  contextRollup?: any;
  cdata?: any;
  objectRollup?: any;
  mode?: any;
  config?: any;
  metadata?: any;
  onPlayerEvent?: (event: EpubPlayerEvent) => void;
  onTelemetryEvent?: (event: any) => void;
}

export const EpubPlayer: React.FC<EpubPlayerProps> = ({
  context,
  contextRollup,
  cdata,
  objectRollup,
  mode,
  config,
  metadata,
  onPlayerEvent,
  onTelemetryEvent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerElementRef = useRef<HTMLElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const playerService = new EpubPlayerService();

    const initializePlayer = async () => {
      if (!containerRef.current) {
        return;
      }

      try {
        if (!mounted) return;

        // Build config - use context as-is, with optional overrides
        const playerConfig: EpubPlayerConfig = {
          context: {
            ...context,
            mode: mode !== undefined ? mode : context.mode,
            contextRollup: contextRollup !== undefined ? contextRollup : context.contextRollup,
            cdata: cdata !== undefined ? cdata : context.cdata,
            objectRollup: objectRollup !== undefined ? objectRollup : context.objectRollup,
          },
          config: config || {},
          metadata: metadata || {},
        };

        console.log('EPUB Player Config:', JSON.stringify(playerConfig, null, 2));

        // Create player element via service
        const epubElement = playerService.createElement(playerConfig);

        // Attach event listeners via service
        playerService.attachEventListeners(
          epubElement,
          (event) => {
            if (onPlayerEvent) onPlayerEvent(event);
          },
          (event) => {
            if (onTelemetryEvent) onTelemetryEvent(event);
          }
        );

        // Store reference to player element
        playerElementRef.current = epubElement;

        // Append to container
        if (containerRef.current && mounted) {
          containerRef.current.appendChild(epubElement);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('EPUB Player initialization failed:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializePlayer();

    // Cleanup function
    return () => {
      mounted = false;
      if (playerElementRef.current) {
        // Remove listeners via service
        playerService.removeEventListeners(playerElementRef.current);
        
        // Remove from DOM if still attached
        if (playerElementRef.current.parentNode) {
          playerElementRef.current.parentNode.removeChild(playerElementRef.current);
        }
        playerElementRef.current = null;
      }
    };
  }, [context, contextRollup, cdata, objectRollup, mode, config, metadata, onPlayerEvent, onTelemetryEvent]);

  return (
    <div ref={containerRef} className="epub-player-container">
      {isLoading && (
        <div className="epub-player-loading">
          Loading EPUB Player...
        </div>
      )}
    </div>
  );
};
