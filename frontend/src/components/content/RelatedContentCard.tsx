import { FiStar } from "react-icons/fi";
import { Badge } from "@/components/common/Badge";
import { Link } from "react-router-dom";
import { RelatedItem } from "@/types/contentTypes";

interface RelatedContentCardProps {
  item: RelatedItem;
}

const RelatedContentCard = ({ item }: RelatedContentCardProps) => {
  return (
    <Link to={`/content/${item.id}`} className="related-resource-card-link">
      <div className="group related-resource-card-container">
        {/* Image with padding */}
        <div className="related-resource-card-image-wrapper">
          <div className="related-resource-card-image-inner">
            <img
              src={item.image}
              alt={item.title}
              className="related-resource-card-image"
            />
          </div>
        </div>

        {/* Content */}
        <div className="related-resource-card-content-wrapper">
          {/* Badge below image */}
          <Badge
            className={`related-resource-card-badge ${item.type === 'Textbook' ? 'related-resource-card-badge-textbook' : 'related-resource-card-badge-course'}`}
          >
            {item.type}
          </Badge>

          {/* Title */}
          <h3 className="related-resource-card-title">
            {item.title}
          </h3>

          {/* Stats - Always show if available */}
          {item.rating && item.learners && item.lessons && (
            <div className="related-resource-card-stats">
              <span className="related-resource-card-rating">
                {item.rating.toFixed(1)}
              </span>
              <FiStar className="related-resource-card-star" />
              <span className="related-resource-card-separator">•</span>
              <span>{item.learners} Learners</span>
              <span className="related-resource-card-separator">•</span>
              <span>{item.lessons} Lessons</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default RelatedContentCard;