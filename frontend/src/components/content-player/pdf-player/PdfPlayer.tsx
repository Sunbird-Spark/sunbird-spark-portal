import React, { useEffect, useRef } from 'react';
import { ContentPlayerService, PdfPlayerConfig, PdfPlayerOptions, PdfPlayerEvent, PdfTelemetryEvent } from '../../../services/players';

// Legacy interface for backward compatibility
interface PlayerEvent {
  type: string;
  [key: string]: any;
}

interface TelemetryEvent {
  eid: string;
  [key: string]: any;
}

interface PdfPlayerProps {
  pdfUrl: string;
  contentName?: string;
  contentId?: string;
  userId?: string;
  userToken?: string;
  onPlayerEvent?: (event: PlayerEvent) => void;
  onTelemetryEvent?: (event: TelemetryEvent) => void;
  showShare?: boolean;
  showDownload?: boolean;
  showPrint?: boolean;
  showReplay?: boolean;
  showExit?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const PdfPlayer: React.FC<PdfPlayerProps> = ({
  pdfUrl,
  contentName = 'PDF Document',
  contentId,
  userId,
  userToken,
  onPlayerEvent,
  onTelemetryEvent,
  showShare,
  showDownload,
  showPrint,
  showReplay,
  showExit,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Using ContentPlayerService which has default configs
  const playerServiceRef = useRef<ContentPlayerService>(new ContentPlayerService());

  // Store the latest callbacks in refs to avoid recreating event listeners
  const onPlayerEventRef = useRef(onPlayerEvent);
  const onTelemetryEventRef = useRef(onTelemetryEvent);

  // Update refs when callbacks change
  useEffect(() => {
    onPlayerEventRef.current = onPlayerEvent;
    onTelemetryEventRef.current = onTelemetryEvent;
  }, [onPlayerEvent, onTelemetryEvent]);

  useEffect(() => {
    const playerService = playerServiceRef.current;

    try {
      // Create player configuration (required fields only)
      const config: PdfPlayerConfig = {
        contentId: contentId || `pdf_${Date.now()}`,
        contentName,
        contentUrl: pdfUrl,
        userId,
        userToken,
      };

      // Options will be merged with service defaults
      // Only pass values that differ from defaults or are explicitly set
      const options: PdfPlayerOptions = {};
      if (showShare !== undefined) options.showShare = showShare;
      if (showDownload !== undefined) options.showDownload = showDownload;
      if (showPrint !== undefined) options.showPrint = showPrint;
      if (showReplay !== undefined) options.showReplay = showReplay;
      if (showExit !== undefined) options.showExit = showExit;

      // Convert service events to legacy format for backward compatibility
      // Use refs to get the latest callback without triggering re-renders
      const handlePlayerEvent = (event: PdfPlayerEvent) => {
        const callback = onPlayerEventRef.current;
        if (callback) {
          // Extract type from the correct location in Sunbird event structure
          // Sunbird events have: { eid: "EVENT", edata: { type: "EVENT" } }
          const eventType = event.type || (event as any).edata?.type || (event as any).eid || 'UNKNOWN';

          const legacyEvent: PlayerEvent = {
            type: eventType,
            playerId: event.playerId,
            timestamp: event.timestamp,
            ...Object.fromEntries(
              Object.entries(event).filter(([key]) => !['type', 'playerId', 'timestamp'].includes(key))
            )
          };
          callback(legacyEvent);
        }
      };

      const handleTelemetryEvent = (event: PdfTelemetryEvent) => {
        const callback = onTelemetryEventRef.current;
        if (callback) {
          // Use eid as the primary event identifier
          const eventId = event.eid || (event as any).edata?.type || 'UNKNOWN';

          const legacyEvent: TelemetryEvent = {
            eid: eventId,
            playerId: event.playerId,
            timestamp: event.timestamp,
            ...Object.fromEntries(
              Object.entries(event).filter(([key]) => !['eid', 'playerId', 'timestamp'].includes(key))
            )
          };
          callback(legacyEvent);
        }
      };

      // Create the player element
      const playerElement = playerService.createElement(config, options);

      // Set up event listeners
      playerService.attachEventListeners(
        playerElement,
        handlePlayerEvent,
        handleTelemetryEvent
      );

      // Add to container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(playerElement);
      }

      // Cleanup function
      return () => {
        playerService.removeEventListeners(playerElement);
        if (containerRef.current?.contains(playerElement)) {
          containerRef.current.removeChild(playerElement);
        }
      };

    } catch (error) {
      console.error('PDF Player Error:', error);
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            height: 200px;
            border: 2px dashed #dc3545;
            border-radius: 8px;
            background-color: #f8d7da;
            color: #721c24;
            text-align: center;
            padding: 20px;
          ">
            <div>
              <h4>PDF Player Error</h4>
              <p>${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
            </div>
          </div>
        `;
      }
    }
  }, [
    // REMOVED: onPlayerEvent, onTelemetryEvent
    // These are now handled via refs to prevent infinite loops
    pdfUrl,
    contentName,
    contentId,
    userId,
    userToken,
    showShare,
    showDownload,
    showPrint,
    showReplay,
    showExit
  ]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '500px',
        ...style
      }}
    />
  );
};

export default PdfPlayer;