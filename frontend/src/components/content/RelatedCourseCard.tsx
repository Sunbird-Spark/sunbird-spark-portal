import { Link } from "react-router-dom";
import { FiStar } from "react-icons/fi";
import { RelatedItem } from "@/types/contentTypes";

interface RelatedCourseCardProps {
  item: RelatedItem;
}

const RelatedCourseCard = ({ item }: RelatedCourseCardProps) => (
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

export default RelatedCourseCard;