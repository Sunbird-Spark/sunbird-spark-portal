import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";
import { RelatedItem } from "@/types/contentTypes";

interface ResourceCardProps {
  item: RelatedItem;
}

const ResourceCard = ({ item }: ResourceCardProps) => {
  const { t } = useAppI18n();

  const getViewLabel = (type: string) => {
    switch (type) {
      case "Video": return t("resource.viewVideo", { defaultValue: "View Video" });
      case "PDF": return t("resource.viewPdf", { defaultValue: "View PDF" });
      case "HTML": return t("resource.viewHtml", { defaultValue: "View HTML" });
      case "Epub": return t("resource.viewEpub", { defaultValue: "View Epub" });
      default: return t("view", { defaultValue: "View" });
    }
  };

  return (
    <Link to={`/content/${item.id}`} className="group resource-card-link">
      <div className="resource-card-container">
        {/* Background Image Container */}
        <div className="resource-card-image-wrapper">
          <img
            src={item.image}
            alt={item.title}
            className="resource-card-image"
          />
        </div>

        {/* Top-left Badge */}
        <div className="resource-card-badge-wrapper">
          <span className="resource-card-badge">
            {item.type}
          </span>
        </div>

        {/* Bottom Content */}
        <div className="resource-card-content">
          <h3 className="resource-card-title">
            {item.title}
          </h3>
          <div className="resource-card-action">
            {getViewLabel(item.type)}
            <FiArrowRight className="resource-card-arrow" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ResourceCard;