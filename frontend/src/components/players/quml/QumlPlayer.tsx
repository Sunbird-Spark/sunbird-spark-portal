import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { qumlPlayerService } from '../../../services/players/quml';
import type { QumlPlayerEvent, QumlPlayerContextProps, QumlPlayerMetadata } from '../../../services/players/quml/types';
import styles from './QumlPlayer.module.css';

interface QumlPlayerProps {
  metadata: QumlPlayerMetadata;
  mode?: string;
  cdata?: any[];
  contextRollup?: { l1: string };
  objectRollup?: Record<string, any>;
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
    let playerElement: HTMLElement | null = null;

    const initializePlayer = async () => {
      if (!containerRef.current || !metadata) {
        console.warn('[QumlPlayer] Container or metadata not available');
        return;
      }

      try {
        // Create player config
        const config = await qumlPlayerService.createConfig(metadata, contextProps);
        
        // Create player element
        playerElement = qumlPlayerService.createElement(config);
        
        // Attach event listeners
        qumlPlayerService.attachEventListeners(
          playerElement,
          handlePlayerEvent,
          handleTelemetryEvent
        );

        // Add to DOM
        containerRef.current.appendChild(playerElement);
        playerElementRef.current = playerElement;

        console.log('[QumlPlayer] Player initialized successfully');
      } catch (error) {
        console.error('[QumlPlayer] Failed to initialize player:', error);
      }
    };

    initializePlayer();

    // Cleanup
    return () => {
      if (playerElement) {
        qumlPlayerService.removeEventListeners(playerElement);
        playerElement.remove();
        playerElementRef.current = null;
      }
    };
  }, [metadata, contextProps, handlePlayerEvent, handleTelemetryEvent]);

  return (
    <div className={styles.qumlPlayerContainer} ref={containerRef} />
  );
};

export default QumlPlayer;
