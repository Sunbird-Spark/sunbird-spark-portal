import { FiUser } from "react-icons/fi";
import { Link } from "react-router-dom";
import { ContentSearchItem } from "@/types/workspaceTypes";
import { useAppI18n } from "@/hooks/useAppI18n";
import { getPlaceholderImage } from "@/utils/getPlaceholderImage";

interface ContentCardProps {
  item: ContentSearchItem;
  linkState?: Record<string, unknown>;
}

const CollectionCard = ({ item, linkState }: ContentCardProps) => {
  const { t } = useAppI18n();
  const lessons = item.leafNodesCount || 0;
  const creator = item.creator ?? item.createdBy ?? 'Unknown';
  
  // Translate primaryCategory badge
  const getCategoryLabel = (category: string | undefined) => {
    if (!category) return t('contentTypes.collection', { defaultValue: 'Collection' });
    const key = category.toLowerCase().replace(/\s+/g, '');
    return t(`contentTypes.${key}`, { defaultValue: category });
  };

  return (
    <Link
      to={`/collection/${item.identifier}`}
      state={linkState}
      className="related-resource-card-link"
      data-edataid="collection-card-click"
      data-objectid={item.identifier}
      data-objecttype="Collection"
    >
      <div className="group related-resource-card-container">
        {/* Image with padding */}
        <div className="related-resource-card-image-wrapper">
          <div className="related-resource-card-image-inner">
            <img
              src={item.posterImage || item.appIcon || getPlaceholderImage(item.identifier)}
              alt={item.name || 'Untitled'}
              className="resource-card-image"
            />
          </div>
        </div>

        {/* Content */}
        <div className="related-resource-card-content-wrapper">
          {/* Badge below image */}
          <div
            className={`related-resource-card-badge truncate max-w-[10rem]`}
          >
            {getCategoryLabel(item.primaryCategory)}
          </div>

          {/* Title */}
          <h3 className="related-resource-card-title">
            {item.name || 'Untitled'}
          </h3>

          {/* Stats: Creator and Lessons */}
          <div className="related-resource-card-stats">
            <div className="flex items-center gap-1">
              <FiUser className="w-3 h-3 text-sunbird-brick -translate-y-0.5" />
              <span className="text-xs text-muted-foreground">{creator}</span>
            </div>
            <span className="related-resource-card-separator">•</span>
            <span>{lessons} {t("contentStats.lessons", { defaultValue: "Lessons" })}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CollectionCard;