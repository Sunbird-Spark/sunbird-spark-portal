import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiStar, FiShare2 } from "react-icons/fi";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import PageLoader from "@/components/common/PageLoader";
import CollectionCard from "@/components/content/CollectionCard";
import ResourceCard from "@/components/content/ResourceCard";
import { ContentPlayer as PlayerComponent } from "@/components/players";
import { useContentPlayer } from "@/hooks/useContentPlayer";
import { useContentRead, useContentSearch } from "@/hooks/useContent";

const ContentPlayerPage = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useContentRead(contentId || '');
  console.log('data', data)
  const contentData = data?.data?.content;
  
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
  
  const { handlePlayerEvent, handleTelemetryEvent } = useContentPlayer({
    onPlayerEvent: (event) => {
      // Handle player events (play, pause, complete, etc.)
      console.log('Content player event:', event);
    },
    onTelemetryEvent: (event) => {
      // Handle telemetry events for analytics
      console.log('Content telemetry event:', event);
    },
  });

  if (isLoading) {
    return <PageLoader message="Loading content..." />;
  }

  if (error) {
    return <div>Error loading content: {error.message}</div>;
  }

  if (!contentData) {
    return <div>Content not found</div>;
  }

  return (
    <div className="content-player-background">
      <Header />

      <main className="content-player-container">
        {/* Go Back Link */}
        <button
          onClick={() => navigate(-1)}
          className="content-player-go-back"
        >
          <FiArrowLeft className="content-player-back-arrow" />
          Go Back
        </button>

        {/* Title Row */}
        <div className="content-player-title-row">
          <h1 className="content-player-title">
            {contentData.name}
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
                mimeType={contentData.mimeType}
                metadata={contentData}
                onPlayerEvent={handlePlayerEvent}
                onTelemetryEvent={handleTelemetryEvent}
              />
            </div>
          </div>
        </div>

        {/* Related Content Section */}
        <section>
          <div className="content-player-related-header">
            <h2 className="content-player-related-title">Related Content</h2>
          </div>

          {(() => {
            // Check if current content mimeType is a collection
            const isCollection = contentData?.mimeType === "application/vnd.ekstep.content-collection";

            if (isCollection) {
              return (
                <div className="content-player-related-grid">
                  {relatedContentData?.data?.content
                    ?.filter((item) => item.identifier !== contentId) // Filter out current content first
                    .slice(0, 3) // Then take first 3
                    .map((item) => (
                      <CollectionCard key={item.identifier} item={item} />
                    ))}
                </div>
              );
            } else {
              return (
                <div className="content-player-related-grid">
                  {relatedContentData?.data?.content
                    ?.filter((item) => item.identifier !== contentId) // Filter out current content first
                    .slice(0, 3) // Then take first 3
                    .map((item) => (
                      <ResourceCard key={item.identifier} item={item} />
                    ))}
                </div>
              );
            }
          })()}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContentPlayerPage;