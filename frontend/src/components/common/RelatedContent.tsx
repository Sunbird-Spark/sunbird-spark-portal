import { Fragment } from "react";
import { useAppI18n } from "@/hooks/useAppI18n";
import CollectionCard from "@/components/content/CollectionCard";
import ResourceCard from "@/components/content/ResourceCard";
import type { RelatedContentItem } from "@/types/collectionTypes";

const DEFAULT_LIMIT = 3;

export type { RelatedContentItem };

export interface RelatedContentProps {
  items: RelatedContentItem[] | undefined;
  cardType: "collection" | "resource";
  title?: string;
  limit?: number;
  linkState?: Record<string, unknown>;
}

const RelatedContent = ({
  items,
  cardType,
  title,
  limit = DEFAULT_LIMIT,
  linkState,
}: RelatedContentProps) => {
  const { t } = useAppI18n();
  const displayTitle = title ?? t("courseDetails.relatedContent");

  if (!items || items.length === 0) {
    return null;
  }

  const displayItems = items.slice(0, limit);

  const renderCard = (item: RelatedContentItem) => {
    const itemCardType = item.cardType ?? cardType;
    const CardComponent = itemCardType === "collection" ? CollectionCard : ResourceCard;
    const card = <CardComponent item={item} linkState={linkState} />;
    return <Fragment key={item.identifier}>{card}</Fragment>;
  };

  return (
    <section>
      <div className="content-player-related-header">
        <h2 className="content-player-related-title">{displayTitle}</h2>
      </div>
      <div className="content-player-related-grid">
        {displayItems.map((item) => renderCard(item))}
      </div>
    </section>
  );
};

export default RelatedContent;
