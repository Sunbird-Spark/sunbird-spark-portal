import { useAppI18n } from "@/hooks/useAppI18n";
import CollectionCard from "@/components/content/CollectionCard";
import ResourceCard from "@/components/content/ResourceCard";
import type { ContentSearchItem } from "@/types/workspaceTypes";

const DEFAULT_LIMIT = 3;

export interface RelatedContentProps {
  items: ContentSearchItem[] | undefined;
  cardType: "collection" | "resource";
  title?: string;
  limit?: number;
}

const RelatedContent = ({
  items,
  cardType,
  title,
  limit = DEFAULT_LIMIT,
}: RelatedContentProps) => {
  const { t } = useAppI18n();
  const displayTitle = title ?? t("courseDetails.relatedContent");

  if (!items || items.length === 0) {
    return null;
  }

  const displayItems = items.slice(0, limit);
  const CardComponent = cardType === "collection" ? CollectionCard : ResourceCard;

  return (
    <section>
      <div className="content-player-related-header">
        <h2 className="content-player-related-title">{displayTitle}</h2>
      </div>
      <div className="content-player-related-grid">
        {displayItems.map((item) => (
          <CardComponent key={item.identifier} item={item} />
        ))}
      </div>
    </section>
  );
};

export default RelatedContent;
