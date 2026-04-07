import React, { useMemo } from 'react';
import { ContentPlayer as PlayerComponent } from '@/components/players';
import CommentSection from './ReviewCommentSection';

interface ContentPlayerSectionProps {
  playerMetadata: any;
  handlePlayerEvent: (event: any) => void;
  handleTelemetryEvent: (event: any) => void;
  isEcmlContent: boolean;
  contentId?: string;
  contentVer?: string;
  contentType?: string;
  isReviewMode: boolean;
  contentName?: string;
}

const ContentPlayerSection: React.FC<ContentPlayerSectionProps> = React.memo(({
  playerMetadata,
  handlePlayerEvent,
  handleTelemetryEvent,
  isEcmlContent,
  contentId,
  contentVer,
  contentType,
  isReviewMode,
  contentName,
}) => {
  const playerContent = useMemo(() => (
    <div className="content-review-player-wrapper">
      <div className="content-review-player-inner">
        <PlayerComponent
          mimeType={playerMetadata.mimeType}
          metadata={playerMetadata}
          mode={isReviewMode ? 'preview' : 'play'}
          onPlayerEvent={handlePlayerEvent}
          onTelemetryEvent={handleTelemetryEvent}
        />
      </div>
    </div>
  ), [playerMetadata, handlePlayerEvent, handleTelemetryEvent, isReviewMode]);

  // Show comments only for ECML content
  if (isEcmlContent && contentId) {
    return (
      <>
        <div className="content-player-title-row">
          <h1 className="content-player-title">{contentName}</h1>
        </div>
        <div className="content-review-player-section">
          <div className="content-review-player-with-comments">
            <div className="content-review-player-main">
              {playerContent}
            </div>
            <div className="content-review-player-sidebar">
              <CommentSection
                contentId={contentId}
                contentVer={contentVer || '0'}
                contentType={contentType || 'application/vnd.ekstep.ecml-archive'}
                isReviewMode={isReviewMode}
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  // For non-ECML content, show player full width
  return (
    <>
      <div className="content-player-title-row">
        <h1 className="content-player-title">{contentName}</h1>
      </div>
      <div className="content-review-player-section">
        {playerContent}
      </div>
    </>
  );
});

ContentPlayerSection.displayName = 'ContentPlayerSection';

export default ContentPlayerSection;
