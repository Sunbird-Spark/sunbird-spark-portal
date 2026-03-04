import { FiStar } from "react-icons/fi";
import { Badge } from "@/components/common/Badge";
import { Link } from "react-router-dom";
import { ContentSearchItem } from "@/types/workspaceTypes";

interface ContentCardProps {
  item: ContentSearchItem;
}

const CollectionCard = ({ item }: ContentCardProps) => {
  return (
    <Link to={`/collection/${item.identifier}`} className="related-resource-card-link">
      <div className="group related-resource-card-container">
        {/* Image with padding */}
        <div className="related-resource-card-image-wrapper">
          <div className="related-resource-card-image-inner">
            {(item.posterImage || item.appIcon) ? (
              <img
                src={item.posterImage || item.appIcon}
                alt={item.name}
                className="resource-card-image"
              />
            ) : (
              <div className="resource-card-image bg-black" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="related-resource-card-content-wrapper">
          {/* Badge below image */}
          <div
            className={`related-resource-card-badge`}
          >
            {item.primaryCategory || 'Collection'}
          </div>

          {/* Title */}
          <h3 className="related-resource-card-title">
            {item.name || 'Untitled'}
          </h3>
        </div>
      </div>
    </Link>
  );
};

export default CollectionCard;