import React from 'react';
import { EpubPlayer } from './EpubPlayer';
import { VideoPlayer } from './VideoPlayer';
import { PdfPlayer } from '../content-player/pdf-player/PdfPlayer';
import { EcmlPlayer } from './EcmlPlayer';
import QumlPlayer from './quml/QumlPlayer';

// MIME type to player component mapping
const MIME_TYPE_PLAYERS = {
  'application/epub': EpubPlayer,
  'video/x-youtube': VideoPlayer,
  'video/webm': VideoPlayer,
  'video/mp4': VideoPlayer,
  'application/pdf': PdfPlayer,
  'application/vnd.ekstep.h5p-archive': EcmlPlayer,
  'application/vnd.ekstep.ecml-archive': EcmlPlayer,
  'application/vnd.sunbird.questionset': QumlPlayer,
  'application/vnd.sunbird.question': QumlPlayer,
  'application/vnd.ekstep.html-archive': EcmlPlayer
} as const;

type SupportedMimeType = keyof typeof MIME_TYPE_PLAYERS;

interface ContentPlayerProps {
  mimeType: string;
  metadata: any;
  mode?: string;
  cdata?: any[];
  contextRollup?: { l1: string };
  objectRollup?: Record<string, any>;
  onPlayerEvent?: (event: any) => void;
  onTelemetryEvent?: (event: any) => void;
}

export const ContentPlayer: React.FC<ContentPlayerProps> = ({
  mimeType,
  metadata,
  mode,
  cdata,
  contextRollup,
  objectRollup,
  onPlayerEvent,
  onTelemetryEvent,
}) => {
  // Get the appropriate player component for the MIME type, fallback to EcmlPlayer
  const PlayerComponent = MIME_TYPE_PLAYERS[mimeType as SupportedMimeType] || EcmlPlayer;

  // Render the appropriate player component
  return (
    <PlayerComponent
      metadata={metadata}
      mode={mode}
      cdata={cdata}
      contextRollup={contextRollup}
      objectRollup={objectRollup}
      onPlayerEvent={onPlayerEvent}
      onTelemetryEvent={onTelemetryEvent}
    />
  );
};

// Export the MIME type mapping for external use
export { MIME_TYPE_PLAYERS };
export type { SupportedMimeType };