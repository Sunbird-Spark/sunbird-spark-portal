import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { qumlPlayerService, QumlPlayerService } from '../../../services/players/quml';
import type { QumlPlayerEvent, QumlPlayerContextProps, QumlPlayerMetadata } from '../../../services/players/quml/types';
import styles from './QumlPlayer.module.css';

interface QumlPlayerProps {
  metadata: QumlPlayerMetadata;
  mode?: string;
  cdata?: any[];
  contextRollup?: Record<string, string>;
  objectRollup?: Record<string, string>;
  onPlayerEvent?: (event: QumlPlayerEvent) => void;
  onTelemetryEvent?: (event: any) => void;
}

const QumlPlayer: React.FC<QumlPlayerProps> = ({
  metadata,
  mode = 'play',
  cdata,
  contextRollup,
  objectRollup,
  onPlayerEvent,
  onTelemetryEvent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerElementRef = useRef<HTMLElement | null>(null);

  // Memoize context props to prevent unnecessary re-renders
  const contextProps = useMemo<QumlPlayerContextProps>(
    () => ({
      mode,
      ...(cdata && { cdata }),
      ...(contextRollup && { contextRollup }),
      ...(objectRollup && { objectRollup }),
    }),
    [mode, cdata, contextRollup, objectRollup]
  );

  // Memoize event handlers
  const handlePlayerEvent = useCallback(
    (event: QumlPlayerEvent) => {
      console.log('[QumlPlayer] Player event:', event);
      onPlayerEvent?.(event);
    },
    [onPlayerEvent]
  );

  const handleTelemetryEvent = useCallback(
    (event: any) => {
      console.log('[QumlPlayer] Telemetry event:', event);
      onTelemetryEvent?.(event);
    },
    [onTelemetryEvent]
  );

  // Initialize player
  useEffect(() => {
    if (!containerRef.current) return;

    let playerElement: HTMLElement | null = null;
    let cancelled = false;

    const initializePlayer = async () => {
      if (!metadata) {
        console.warn('[QumlPlayer] Metadata not available');
        return;
      }

      try {
        // Create player config
        const config = await qumlPlayerService.createConfig(metadata, contextProps);
        
        if (cancelled) return;
        
        // Create player element
        playerElement = qumlPlayerService.createElement(config);
        
        // Attach event listeners
        qumlPlayerService.attachEventListeners(
          playerElement,
          handlePlayerEvent,
          handleTelemetryEvent
        );

        // Add to DOM
        if (containerRef.current) {
          containerRef.current.appendChild(playerElement);
          playerElementRef.current = playerElement;
          console.log('[QumlPlayer] Player initialized successfully');
        }
      } catch (error) {
        console.error('[QumlPlayer] Failed to initialize player:', error);
      }
    };

    initializePlayer();

    // Cleanup
    return () => {
      cancelled = true;
      if (playerElement) {
        qumlPlayerService.removeEventListeners(playerElement);
        playerElement.remove();
        playerElementRef.current = null;
      }
      QumlPlayerService.unloadStyles();
    };
  }, [metadata, contextProps, handlePlayerEvent, handleTelemetryEvent]);

  return (
    <div className={`content-player-embed ${styles.qumlPlayerContainer}`} ref={containerRef} />
  );
};

export default QumlPlayer;
