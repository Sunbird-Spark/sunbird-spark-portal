import React, { useRef, useEffect } from 'react';

interface QumlPlayerProps {
  playerConfig: any;
  telemetryEvents?: (event: any) => void;
  playerEvent?: (event: any) => void;
  questionListUrl?: string;
}

const QumlPlayer: React.FC<QumlPlayerProps> = ({
  playerConfig,
  telemetryEvents,
  playerEvent,
  questionListUrl = 'https://staging.sunbirded.org/api/question/v2/list'
}) => {
  const playerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Set global question list URL as required by the player
    if (window) {
      window.questionListUrl = questionListUrl;
    }

    const playerElement = playerRef.current;

    if (playerElement) {
      // Use setAttribute for player-config as seen in vanilla JS example
      // This ensures compatibility if the web component expects attribute parsing
      playerElement.setAttribute('player-config', JSON.stringify(playerConfig));

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
  }, [playerConfig, playerEvent, telemetryEvents, questionListUrl]);

  return (
    <div className="w-full h-full">
      <sunbird-quml-player ref={playerRef}></sunbird-quml-player>
    </div>
  );
};

export default QumlPlayer;
