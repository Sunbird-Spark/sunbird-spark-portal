import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { RelatedItem } from "@/types/contentTypes";

interface RelatedResourceCardProps {
  item: RelatedItem;
}

const RelatedResourceCard = ({ item }: RelatedResourceCardProps) => (
  <Link to={`/content/${item.id}`} className="related-resource-card-link">
    <div className="related-resource-card-container">
      <div
        className="related-resource-card-image"
        style={{
          backgroundImage: `url(${item.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      <div className="related-resource-card-badge-container">
        <span className="related-resource-card-type-badge">
          {item.type}
        </span>
      </div>

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

export default RelatedResourceCard;