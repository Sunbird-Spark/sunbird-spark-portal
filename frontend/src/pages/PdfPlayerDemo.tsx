import React, { useCallback } from 'react';
import PdfPlayer from '../components/content-player/pdf-player/PdfPlayer';

// Legacy types for backward compatibility
interface PlayerEvent {
  type: string;
  [key: string]: any;
}

interface TelemetryEvent {
  eid: string;
  [key: string]: any;
}

const PdfPlayerDemo: React.FC = () => {
  // Using Mozilla's PDF.js test file (reliable and CORS-enabled)
  const pdfUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

  // Memoize callbacks to prevent unnecessary re-renders
  const handlePlayerEvent = useCallback((event: PlayerEvent) => {
    // Handle player events
  }, []);

  const handleTelemetryEvent = useCallback((event: TelemetryEvent) => {
    // Handle telemetry events
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        padding: '15px 20px',
        backgroundColor: 'white',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Sunbird PDF Player Demo</h1>
        <div style={{
          fontSize: '14px',
          color: '#666',
          backgroundColor: '#f0f0f0',
          padding: '8px 12px',
          borderRadius: '4px'
        }}>
          📄 Mozilla PDF.js Test File
        </div>
      </div>

      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'visible'
      }}>
        <PdfPlayer
          pdfUrl={pdfUrl}
          contentName="Mozilla PDF.js Test Document"
          onPlayerEvent={handlePlayerEvent}
          onTelemetryEvent={handleTelemetryEvent}
          showShare={true}
          showDownload={true}
          showPrint={true}
        />
      </div>
    </div>
  );
};

export default PdfPlayerDemo;