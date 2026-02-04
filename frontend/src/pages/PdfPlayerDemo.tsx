import React, { useState, useCallback } from 'react';
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
  const [showPlayer, setShowPlayer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(
    // Using Mozilla's PDF.js test file (reliable and CORS-enabled)
    'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
  );

  // Memoize callbacks to prevent unnecessary re-renders
  const handlePlayerEvent = useCallback((event: PlayerEvent) => {
    console.log('🎬 Player Event:', event);
  }, []); // Empty deps array - function never changes

  const handleTelemetryEvent = useCallback((event: TelemetryEvent) => {
    console.log('📊 Telemetry Event:', event);
  }, []); // Empty deps array - function never changes

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      <h1 style={{ marginBottom: '20px' }}>Sunbird PDF Player Demo</h1>

      {!showPlayer ? (
        <div style={{ maxWidth: '600px' }}>
          {/* Test PDF URLs selector */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              📄 Quick Test PDFs:
            </label>
            <select
              onChange={(e) => setPdfUrl(e.target.value)}
              value={pdfUrl}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf">
                ✅ Mozilla PDF.js Test (Recommended - Small, Fast)
              </option>
              <option value="">Custom URL...</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              🔗 PDF URL:
            </label>
            <input
              type="text"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              placeholder="Enter PDF URL or select from dropdown above"
            />
          </div>

          <button
            onClick={() => setShowPlayer(true)}
            disabled={!pdfUrl}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: pdfUrl ? 'pointer' : 'not-allowed',
              opacity: pdfUrl ? 1 : 0.5,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (pdfUrl) {
                e.currentTarget.style.backgroundColor = '#0056b3';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#007bff';
            }}
          >
            🚀 Load PDF Player
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setShowPlayer(false)}
            style={{
              marginBottom: '10px',
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>

          <div style={{
            height: 'calc(100vh - 150px)',
            border: '1px solid #ddd',
            borderRadius: '4px',
            overflow: 'hidden',
            backgroundColor: '#f9f9f9'
          }}>
            <PdfPlayer
              pdfUrl={pdfUrl}
              contentName="Demo PDF Document"
              onPlayerEvent={handlePlayerEvent}
              onTelemetryEvent={handleTelemetryEvent}
              showShare={true}
              showDownload={true}
              showPrint={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfPlayerDemo;