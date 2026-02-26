import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import PageLoader from "@/components/common/PageLoader";
import RelatedContent from "@/components/common/RelatedContent";
import RatingDialog from "@/components/common/RatingDialog";
import { mapSearchContentToRelatedContentItems } from "@/services/collection";
import { ContentPlayer as PlayerComponent } from "@/components/players";
import { useContentPlayer } from "@/hooks/useContentPlayer";
import { useContentRead, useContentSearch } from "@/hooks/useContent";
import { useQumlContent } from "@/hooks/useQumlContent";

const ContentPlayerPage = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useContentRead(contentId || '');
  const contentData = data?.data?.content;
  
  // Check if this is QUML content that needs special handling
  const isQumlContent = contentData?.mimeType === 'application/vnd.sunbird.questionset' || 
                       contentData?.mimeType === 'application/vnd.sunbird.question';
  
  // Use QUML hook for question sets, regular content hook for others
  const { 
    data: qumlData, 
    isLoading: isQumlLoading, 
    error: qumlError 
  } = useQumlContent(contentId || '', { enabled: isQumlContent });
  
  // Determine which data to use based on content type
  const playerMetadata = isQumlContent ? qumlData : contentData;
  const playerIsLoading = isQumlContent ? isQumlLoading : isLoading;
  const playerError = isQumlContent ? qumlError : error;
  
  // Search for related content based on mime type
  const { data: relatedContentData } = useContentSearch({
    request: {
      filters: {
        mimeType: contentData?.mimeType,
        status: 'Live'
      },
      limit: 3,
      offset: 0
    },
    enabled: !!contentData?.mimeType
  });

  const relatedContentItems = useMemo(
    () =>
      mapSearchContentToRelatedContentItems(
        relatedContentData?.data?.content,
        contentId ?? undefined,
        3
      ),
    [relatedContentData?.data?.content, contentId]
  );
  
  const isH5pContent = contentData?.mimeType === 'application/vnd.ekstep.h5p-archive';

  // Stable ref so telemetry callback doesn't need isH5pContent in its deps
  const isH5pContentRef = useRef(false);
  useEffect(() => { isH5pContentRef.current = isH5pContent; }, [isH5pContent]);

  const [ratingOpen, setRatingOpen] = useState(false);

  // Once the rating dialog has been shown and dismissed, allow navigation
  const ratingDoneRef = useRef(false);
  // Set when a navigation was intercepted and should proceed after the dialog closes
  const pendingNavigateRef = useRef(false);

  const handleRatingClose = useCallback(() => {
    ratingDoneRef.current = true;
    setRatingOpen(false);
    if (pendingNavigateRef.current) {
      pendingNavigateRef.current = false;
      navigate(-1);
    }
  }, [navigate]);

  // For H5P: show the dialog before navigating back; for all other content: navigate immediately
  const handleGoBack = useCallback(() => {
    if (isH5pContent && !ratingDoneRef.current) {
      pendingNavigateRef.current = true;
      setRatingOpen(true);
    } else {
      navigate(-1);
    }
  }, [isH5pContent, navigate]);

  const onPlayerEvent = useCallback((event: unknown) => {
    console.log('Content player event:', event);
  }, []);

  const onTelemetryEvent = useCallback((event: unknown) => {
    console.log('Content telemetry event:', event);
    const eid = ((event as any)?.eid ?? (event as any)?.data?.eid ?? (event as any)?.type ?? "").toUpperCase();
    if (eid === "END") setTimeout(() => setRatingOpen(true), 5000);
  }, []);

  const { handlePlayerEvent, handleTelemetryEvent } = useContentPlayer({
    onPlayerEvent,
    onTelemetryEvent,
  });

  if (playerIsLoading) {
    return <PageLoader message="Loading content..." />;
  }

  if (playerError) {
    return <div>Error loading content: {playerError.message}</div>;
  }

  if (!playerMetadata) {
    return <div>Content not found</div>;
  }

  return (
    <div className="content-player-background">
      <Header />

      <main className="content-player-container">
        {/* Go Back Link */}
        <button
          onClick={handleGoBack}
          className="content-player-go-back"
        >
          <FiArrowLeft className="content-player-back-arrow" />
          Go Back
        </button>

        {/* Title Row */}
        <div className="content-player-title-row">
          <h1 className="content-player-title">
            {playerMetadata.name}
          </h1>
        </div>

        {/* Stats Row */}
        {/* <div className="content-player-stats-row">
          <span className="content-player-rating-container">
            4.5
            <FiStar className="content-player-star-icon" />
          </span>
          <span className="content-player-stats-separator">•</span>
          <span>1.2k Learners</span>
          <button className="content-player-share-btn">
            <FiShare2 className="content-player-share-icon" />
            Share
          </button>
        </div> */}

        {/* Content Player */}
        <div className="content-player-video-container">
          <div className="content-player-video-wrapper">
            <div className="content-player-video-relative">
              <PlayerComponent
                mimeType={playerMetadata.mimeType}
                metadata={playerMetadata}
                onPlayerEvent={handlePlayerEvent}
                onTelemetryEvent={handleTelemetryEvent}
              />
              <RatingDialog
                open={ratingOpen}
                onClose={handleRatingClose}
                playerMetadata={playerMetadata}
              />
            </div>
          </div>
        </div>

        {/* Related Content Section */}
        <RelatedContent
          items={relatedContentItems}
          cardType={
            contentData?.mimeType === "application/vnd.ekstep.content-collection"
              ? "collection"
              : "resource"
          }
        />
      </main>

      <Footer />
    </div>
  );
};

export default ContentPlayerPage;