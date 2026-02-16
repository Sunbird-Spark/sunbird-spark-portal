import { FiStar } from "react-icons/fi";
import { Badge } from "@/components/common/Badge";
import { Link } from "react-router-dom";
import { ContentSearchItem } from "@/types/workspaceTypes";

interface ContentCardProps {
  item: ContentSearchItem;
}

const ContentCard = ({ item }: ContentCardProps) => {
  return (
    <Link to={`/content/${item.identifier}`} className="related-resource-card-link">
      <div className="group related-resource-card-container">
        {/* Image with padding */}
        <div className="related-resource-card-image-wrapper">
          <div className="related-resource-card-image-inner">
            <img
              src={item.posterImage || item.thumbnail || ''}
              alt={item.name || ''}
              className="related-resource-card-image"
            />
          </div>
        </div>

        {/* Content */}
        <div className="related-resource-card-content-wrapper">
          {/* Badge below image */}
          <Badge
            className={`related-resource-card-badge ${item.objectType === 'Textbook' ? 'related-resource-card-badge-textbook' : 'related-resource-card-badge-course'}`}
          >
            {item.objectType || 'Content'}
          </Badge>

          {/* Title */}
          <h3 className="related-resource-card-title">
            {item.name || 'Untitled'}
          </h3>

          {/* Stats - Show basic info if available */}
          <div className="related-resource-card-stats">
            <span>{item.objectType || 'Content'}</span>
            {item.status && (
              <>
                <span className="related-resource-card-separator">•</span>
                <span>{item.status}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ContentCard;