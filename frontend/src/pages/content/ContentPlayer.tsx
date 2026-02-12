import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiArrowLeft, FiPlay, FiArrowRight, FiStar, FiShare2 } from "react-icons/fi";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import PageLoader from "@/components/common/PageLoader";

// Import resource images
import resourceRobotHand from "@/assets/resource-robot-hand1.svg";
import resourceHacker from "@/assets/resource-hacker.svg";
import resourceRobot from "@/assets/resource-robot.svg";
import resourceTextBook from "@/assets/resource-text-book.svg"

// Mock content data
const contentData = {
  id: "1",
  title: "The AI Engineer Introduction",
  rating: 4.5,
  learners: "9k",
  lessons: 25,
  image: resourceRobotHand,
  currentWeek: "Week 1: Foundation & Basics",
  relatedContent: [
    {
      id: "r-1",
      title: "The AI Engineer Course 2026: Complete AI Engineer Bootcamp",
      type: "Course",
      image: resourceRobot,
      rating: 4.5,
      learners: "9k",
      lessons: 25,
    },
    {
      id: "r-2",
      title: "Generative AI for Cybersecurity Professionals",
      type: "PDF",
      image: resourceHacker,
      isResource: true,
    },
    {
      id: "r-3",
      title: "Data Engineering Foundations",
      type: "Textbook",
      image: resourceTextBook,
      rating: 4.5,
      learners: "9k",
      lessons: 25,
    },
  ],
};

const ContentPlayer = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [contentId]);

  if (isLoading) {
    return <PageLoader message="Loading content..." />;
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
            <FiArrowRight className="content-player-related-arrow" />
          </div>

          <div className="content-player-related-grid">
            {contentData.relatedContent.map((item) =>
              item.isResource ? (
                <RelatedResourceCard key={item.id} item={item} />
              ) : (
                <RelatedCourseCard key={item.id} item={item} />
              ),
            )}
          </div>

          {/* Carousel Navigation */}
          <div className="content-player-carousel-nav">
            <button className="content-player-carousel-btn-prev">
              <FiArrowLeft className="content-player-carousel-arrow-gray" />
            </button>
            <div className="content-player-carousel-indicators">
              <div className="content-player-carousel-dot-active" />
              <div className="content-player-carousel-dot-inactive" />
            </div>
            <button className="content-player-carousel-btn-next">
              <FiArrowRight className="content-player-carousel-arrow-white" />
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

// Related Content Cards
interface RelatedItem {
  id: string;
  title: string;
  type: string;
  image: string;
  isResource?: boolean;
  rating?: number;
  learners?: string;
  lessons?: number;
}

const RelatedCourseCard = ({ item }: { item: RelatedItem }) => (
  <Link to={`/content/${item.id}`} className="related-course-card-link">
    <div className="related-course-card-container">
      <div className="related-course-card-image-container">
        <img
          src={item.image}
          alt={item.title}
          className="related-course-card-image"
        />
      </div>
      <div className="related-course-card-content">
        <span className="related-course-card-type-badge">
          {item.type}
        </span>
        <h3 className="related-course-card-title">
          {item.title}
        </h3>
        <div className="related-course-card-stats">
          <span className="related-course-card-rating">
            {item.rating}
            <FiStar className="related-course-card-star" />
          </span>
          <span className="related-course-card-separator">•</span>
          <span>{item.learners} Learners</span>
          <span className="related-course-card-separator">•</span>
          <span>{item.lessons} Lessons</span>
        </div>
      </div>
    </div>
  </Link>
);

const RelatedResourceCard = ({ item }: { item: RelatedItem }) => (
  <Link to={`/content/${item.id}`} className="related-resource-card-link">
    <div className="related-resource-card-container">
      <img
        src={item.image}
        alt={item.title}
        className="related-resource-card-image"
      />

      {/* Type Badge */}
      <div className="related-resource-card-badge-container">
        <span className="related-resource-card-type-badge">
          {item.type}
        </span>
      </div>

      {/* Content */}
      <div className="related-resource-card-content">
        <h3 className="content-player-resource-title">
          {item.title}
        </h3>
        <p className="related-resource-card-subtitle">
          See the Case Study
          <FiArrowRight className="related-resource-card-arrow" />
        </p>
      </div>
    </div>
  </Link>
);

export default ContentPlayer;
