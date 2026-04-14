import React, { useState, useCallback } from 'react';
import { EpubPlayer } from './EpubPlayer';
import { VideoPlayer } from './VideoPlayer';
import { PdfPlayer } from '../content-player/pdf-player/PdfPlayer';
import { EcmlPlayer } from './EcmlPlayer';
import QumlPlayer from './quml/QumlPlayer';
import RatingDialog from '@/components/common/RatingDialog';
import { useRatingTimer } from '@/hooks/useRatingTimer';

// MIME type to player component mapping
const MIME_TYPE_PLAYERS = {
  'application/epub': EpubPlayer,
  'video/x-youtube': EcmlPlayer,
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
  contextRollup?: Record<string, string>;
  objectRollup?: Record<string, string>;
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
  const [ratingOpen, setRatingOpen] = useState(false);
  const openRating = useCallback(() => setRatingOpen(true), []);
  const { onContentEnd, onContentStart } = useRatingTimer(openRating);

  const handleTelemetry = useCallback((event: any) => {
    const eid = ((event?.eid ?? event?.data?.eid ?? event?.type) ?? '').toUpperCase();
    if (eid === 'END') onContentEnd();
    if (eid === 'START') onContentStart();
    onTelemetryEvent?.(event);
  }, [onContentEnd, onContentStart, onTelemetryEvent]);

  const PlayerComponent = MIME_TYPE_PLAYERS[mimeType as SupportedMimeType] || EcmlPlayer;

  return (
    <div className="content-player-wrapper">
      <PlayerComponent
        metadata={metadata}
        mode={mode}
        cdata={cdata}
        contextRollup={contextRollup}
        objectRollup={objectRollup}
        onPlayerEvent={onPlayerEvent}
        onTelemetryEvent={handleTelemetry}
      />
      <RatingDialog
        open={ratingOpen}
        onClose={() => setRatingOpen(false)}
        playerMetadata={metadata}
      />
    </div>
  );
};

// Export the MIME type mapping for external use
export { MIME_TYPE_PLAYERS };
export type { SupportedMimeType };
