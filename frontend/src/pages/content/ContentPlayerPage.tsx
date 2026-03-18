import { useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import PageLoader from "@/components/common/PageLoader";
import RelatedContent from "@/components/common/RelatedContent";
import { mapSearchContentToRelatedContentItems } from "@/services/collection";
import { ContentPlayer as PlayerComponent } from "@/components/players";
import { useContentPlayer } from "@/hooks/useContentPlayer";
import { useContentRead, useContentSearch } from "@/hooks/useContent";
import { useQumlContent } from "@/hooks/useQumlContent";
import { useAppI18n } from "@/hooks/useAppI18n";
import { TelemetryTracker } from '@/components/telemetry/TelemetryTracker';
import useImpression from "@/hooks/useImpression";
import { useTelemetry } from "@/hooks/useTelemetry";

const ContentPlayerPage = () => {
  const { t } = useAppI18n();
  const { contentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  useImpression({ type: 'view', pageid: 'content-player', object: { id: contentId || '', type: 'Content' } });
  const telemetry = useTelemetry();

  // Resolve where to go back: reject any /content/ or /collection/ path as a back-destination
  // to prevent content→content and content→collection back chains. Falls back to /explore,
  // which is accessible to both authenticated and anonymous users.
  const stateFrom = (location.state as { from?: string } | null)?.from ?? '';
  const backTo = stateFrom && !stateFrom.startsWith('/content/') && !stateFrom.startsWith('/collection/') ? stateFrom : '/explore';
  const linkState = { from: backTo };

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
  
  const { handlePlayerEvent, handleTelemetryEvent } = useContentPlayer({
    onTelemetryEvent: (event) => {
      if (event?.eid === 'ASSESS') {
        telemetry.audit({
          edata: {
            props: ['score'],
            state: (event?.edata?.pass === true || String(event?.edata?.pass).toLowerCase() === 'yes') ? 'Passed' : 'Failed',
          },
          object: { id: contentId || '', type: 'Content' },
        });
      }
    },
  });

  if (playerIsLoading) {
    return <PageLoader message={t('loadingContent')} />;
  }

  if (playerError) {
    return <div>{t('content.errorLoading', { error: playerError.message })}</div>;
  }

  if (!playerMetadata) {
    return <div>{t('content.notFound')}</div>;
  }

  return (
    <div className="content-player-background">
      <TelemetryTracker
        disabled={!playerMetadata}
        startEventInput={{ type: 'workflow', mode: 'play', pageid: 'content-player-page' }}
        endEventInput={{ type: 'workflow', mode: 'play', pageid: 'content-player-exit' }}
        startOptions={{ 
          object: { id: contentId, type: playerMetadata?.contentType || 'Content', ver: playerMetadata?.pkgVersion?.toString() || '1' },
          context: { env: 'content-player' }
        }}
        endOptions={{ 
          object: { id: contentId, type: playerMetadata?.contentType || 'Content', ver: playerMetadata?.pkgVersion?.toString() || '1' },
          context: { env: 'content-player' }
        }}
      />
      <Header />

      <main className="content-player-container">
        {/* Go Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="content-player-go-back"
        >
          <FiArrowLeft className="content-player-back-arrow" />
          {t('button.goBack')}
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
          <PlayerComponent
            mimeType={playerMetadata.mimeType}
            metadata={playerMetadata}
            onPlayerEvent={handlePlayerEvent}
            onTelemetryEvent={handleTelemetryEvent}
          />
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