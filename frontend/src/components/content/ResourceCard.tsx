import { FiArrowRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAppI18n } from "@/hooks/useAppI18n";
import { ContentSearchItem } from "@/types/workspaceTypes";
import CardThumbnailBackground from "@/components/workspace/CardThumbnailBackground";

interface ResourceCardProps {
  item: ContentSearchItem;
}

const ResourceCard = ({ item }: ResourceCardProps) => {
  const { t } = useAppI18n();

  const getViewLabel = (mimeType?: string) => {
    switch (mimeType) {
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
      case "application/vnd.ekstep.ecml-archive":
        return t("resource.ecmlBadge", { defaultValue: "ECML" });
      case "application/vnd.ekstep.h5p-archive":
        return t("resource.h5pBadge", { defaultValue: "H5P" });
      default: 
        return t("view", { defaultValue: "View" });
    }
  };

  return (
    <Link to={`/content/${item.identifier}`} className="group resource-card-link">
      <div className="resource-card-container">
        {/* Background Image Container */}
        <div className="resource-card-image-wrapper">
          {item.appIcon ? (
            <img 
              src={item.appIcon} 
              alt={item.name || 'Resource'} 
              className="resource-card-image" 
            />
          ) : (
            <div className="resource-card-image">
              <CardThumbnailBackground 
                type="content" 
                primaryCategory={item.primaryCategory}
                iconSize="sm"
              />
            </div>
          )}
          {/* Purple-pink gradient overlay for text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-pink-900/30 to-transparent pointer-events-none" />
        </div>

        {/* Top-left Badge */}
        <div className="resource-card-badge-wrapper">
          <span className="resource-card-badge">
            {getViewLabel(item.mimeType)}
          </span>
        </div>

        {/* Bottom Content */}
        <div className="resource-card-content">
          <h3 className="resource-card-title">
            {item.name || 'Untitled'}
          </h3>
          <div className="resource-card-action">
            {getViewLabel(item.mimeType)}
            <FiArrowRight className="resource-card-arrow" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ResourceCard;