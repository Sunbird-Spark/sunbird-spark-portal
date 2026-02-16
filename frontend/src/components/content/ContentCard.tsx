import { FiStar } from "react-icons/fi";
import { Badge } from "@/components/common/Badge";
import { Link } from "react-router-dom";
import { ContentData } from "@/types/contentTypes";

interface ContentCardProps {
  item: ContentData;
}

const ContentCard = ({ item }: ContentCardProps) => {
  return (
    <Link to={`/content/${item.identifier}`} className="related-resource-card-link">
      <div className="group related-resource-card-container">
        {/* Image with padding */}
        <div className="related-resource-card-image-wrapper">
          <div className="related-resource-card-image-inner">
            <img
              src={item.previewUrl || ''}
              alt={item.name}
              className="related-resource-card-image"
            />
          </div>
        </div>

        {/* Content */}
        <div className="related-resource-card-content-wrapper">
          {/* Badge below image */}
          <Badge
            className={`related-resource-card-badge ${item.primaryCategory === 'Textbook' ? 'related-resource-card-badge-textbook' : 'related-resource-card-badge-course'}`}
          >
            {item.primaryCategory}
          </Badge>

          {/* Title */}
          <h3 className="related-resource-card-title">
            {item.name}
          </h3>

          {/* Stats - Show basic info if available */}
          <div className="related-resource-card-stats">
            <span>{item.mediaType}</span>
            {item.language && item.language.length > 0 && (
              <>
                <span className="related-resource-card-separator">•</span>
                <span>{item.language[0]}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ContentCard;