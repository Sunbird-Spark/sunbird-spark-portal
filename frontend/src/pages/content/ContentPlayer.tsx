import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiPlay, FiStar, FiShare2 } from "react-icons/fi";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import PageLoader from "@/components/common/PageLoader";
import ContentCard from "@/components/content/ContentCard";
import ResourceCard from "@/components/content/ResourceCard";
import { fetchContentById } from "@/services/ContentService";
import { ContentData } from "@/types/contentTypes";

const ContentPlayer = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [contentData, setContentData] = useState<ContentData | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      if (!contentId) return;
      
      setIsLoading(true);
      try {
        const data = await fetchContentById(contentId);
        setContentData(data);
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [contentId]);

  if (isLoading) {
    return <PageLoader message="Loading content..." />;
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
            {contentData.title}
          </h1>
        </div>

        {/* Stats Row */}
        <div className="content-player-stats-row">
          <span className="content-player-rating-container">
            {contentData.rating}
            <FiStar className="content-player-star-icon" />
          </span>
          <span className="content-player-stats-separator">•</span>
          <span>{contentData.learners} Learners</span>
          <button className="content-player-share-btn">
            <FiShare2 className="content-player-share-icon" />
            Share
          </button>
        </div>

        {/* Centered Video Player */}
        <div className="content-player-video-container">
          <div className="content-player-video-wrapper">
            <div className="content-player-video-relative">
              {/* Video Thumbnail */}
              <div className="content-player-video-thumbnail">
                <img src={contentData.image} alt={contentData.title} className="content-player-video-image" />

                {/* Play Button */}
                <button className="content-player-play-button">
                  <FiPlay className="content-player-play-icon" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Content Section */}
        <section>
          <div className="content-player-related-header">
            <h2 className="content-player-related-title">Related Content</h2>
          </div>

          <div className="content-player-related-grid">
            {contentData.relatedContent.map((item) => {
              if (item.isResource) {
                return <ResourceCard key={item.id} item={item} />;
              } else {
                return <ContentCard key={item.id} item={item} />;
              }
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContentPlayer;