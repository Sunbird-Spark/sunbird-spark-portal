import React, { useEffect, useRef } from 'react';

interface QUMLPlayerProps {
  playerConfig: any;
  telemetryEvents?: (event: any) => void;
}

const QUMLPlayer: React.FC<QUMLPlayerProps> = ({ playerConfig, telemetryEvents }) => {
  const playerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const playerElement = playerRef.current;

    const handleTelemetryEvent = (event: CustomEvent) => {
      if (telemetryEvents) {
        telemetryEvents(event.detail);
      }
    };

    if (playerElement) {
      playerElement.addEventListener('playerEvent', handleTelemetryEvent as EventListener);
      playerElement.addEventListener('telemetryEvent', handleTelemetryEvent as EventListener);
    }

    return () => {
      if (playerElement) {
        playerElement.removeEventListener('playerEvent', handleTelemetryEvent as EventListener);
        playerElement.removeEventListener('telemetryEvent', handleTelemetryEvent as EventListener);
      }
    };
  }, [telemetryEvents]);

  return (
    <div className="quml-player-container" style={{ width: '100%', height: '100%' }}>
      <sunbird-quml-player
        player-config={JSON.stringify(playerConfig)}
        ref={playerRef}
      >
      </sunbird-quml-player>
    </div>
  );
};

export default QUMLPlayer;
