import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";
import { ContentData } from "@/types/contentTypes";

interface ResourceCardProps {
  item: ContentData;
}

const ResourceCard = ({ item }: ResourceCardProps) => {
  const { t } = useAppI18n();

  const getViewLabel = (item: ContentData) => {
    switch (item.mimeType) {
      case "video/x-youtube":
      case "video/webm":
      case "video/mp4":
        return t("resource.videoBadge", { defaultValue: "Video" });
      case "application/pdf":
        return t("resource.pdfBadge", { defaultValue: "PDF" });
      case "application/vnd.ekstep.html-archive":
        return t("resource.htmlBadge", { defaultValue: "HTML" });
      case "application/epub":
        return t("resource.epubBadge", { defaultValue: "EPUB" });
      default: 
        return t("view", { defaultValue: "View" });
    }
  };

  return (
    <Link to={`/content/${item.identifier}`} className="group resource-card-link">
      <div className="resource-card-container">
        {/* Background Image Container */}
        <div className="resource-card-image-wrapper">
          <img
            src={item.previewUrl || ''}
            alt={item.name}
            className="resource-card-image"
          />
        </div>

        {/* Top-left Badge */}
        <div className="resource-card-badge-wrapper">
          <span className="resource-card-badge">
            {getViewLabel(item)}
          </span>
        </div>

        {/* Bottom Content */}
        <div className="resource-card-content">
          <h3 className="resource-card-title">
            {item.name}
          </h3>
          <div className="resource-card-action">
            {getViewLabel(item)}
            <FiArrowRight className="resource-card-arrow" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ResourceCard;