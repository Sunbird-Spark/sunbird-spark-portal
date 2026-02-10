import React, { useRef, useEffect } from 'react';

interface QumlPlayerProps {
  playerConfig: any;
  telemetryEvents?: (event: any) => void;
  playerEvent?: (event: any) => void;
}

const QumlPlayer: React.FC<QumlPlayerProps> = ({ playerConfig, telemetryEvents, playerEvent }) => {
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const playerElement = playerRef.current;

    if (playerElement) {
      // Set the property directly on the DOM element
      playerElement.playerConfig = playerConfig;

      const handlePlayerEvent = (event: any) => {
        if (playerEvent) {
          playerEvent(event);
        }
      };

      const handleTelemetryEvent = (event: any) => {
        if (telemetryEvents) {
          telemetryEvents(event);
        }
      };

      playerElement.addEventListener('playerEvent', handlePlayerEvent);
      playerElement.addEventListener('telemetryEvent', handleTelemetryEvent);

      return () => {
        playerElement.removeEventListener('playerEvent', handlePlayerEvent);
        playerElement.removeEventListener('telemetryEvent', handleTelemetryEvent);
      };
    }
  }, [playerConfig, playerEvent, telemetryEvents]);

  return (
    <div className="w-full h-full">
      <sunbird-quml-player ref={playerRef}></sunbird-quml-player>
    </div>
  );
};

export default QumlPlayer;
