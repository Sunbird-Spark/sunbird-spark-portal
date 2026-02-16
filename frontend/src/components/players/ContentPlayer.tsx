import React from 'react';
import { EpubPlayer } from './EpubPlayer';
import { VideoPlayer } from './VideoPlayer';
import { PdfPlayer } from '../content-player/pdf-player/PdfPlayer';
import { EcmlPlayer } from './EcmlPlayer';

// MIME type to player component mapping
const MIME_TYPE_PLAYERS = {
  'application/epub': EpubPlayer,
  'video/x-youtube': VideoPlayer,
  'video/webm': VideoPlayer,
  'video/mp4': VideoPlayer,
  'application/pdf': PdfPlayer,
  'application/vnd.ekstep.ecml-archive': EcmlPlayer,
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
  // Get the appropriate player component for the MIME type
  const PlayerComponent = MIME_TYPE_PLAYERS[mimeType as SupportedMimeType];

  // If no player is found for the MIME type, show unsupported content message
  if (!PlayerComponent) {
    return (
      <div className="w-full h-full min-h-[600px] relative flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h3 className="text-lg font-semibold mb-2">Unsupported Content Type</h3>
          <p className="text-gray-600">
            No player available for MIME type: <code className="bg-gray-200 px-2 py-1 rounded">{mimeType}</code>
          </p>
          <p className="text-sm text-gray-500 mt-2">Content: {metadata?.name || 'Unknown'}</p>
        </div>
      </div>
    );
  }

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