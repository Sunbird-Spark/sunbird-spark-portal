import { useAppI18n } from "@/hooks/useAppI18n";
import PageLoader from "@/components/common/PageLoader";
import RelatedContent from "@/components/common/RelatedContent";

interface RelatedContentSectionProps {
  searchError: boolean;
  searchErrorObj: Error | null;
  searchFetching: boolean;
  relatedContentItems: any[];
  searchRefetch: () => void;
}

export default function RelatedContentSection({
  searchError,
  searchErrorObj,
  searchFetching,
  relatedContentItems,
  searchRefetch,
}: RelatedContentSectionProps) {
  const { t } = useAppI18n();

  return (
    <section className="mt-16">
      {(searchError || (searchFetching && relatedContentItems.length === 0)) && (
        <div className="content-player-related-header mb-6">
          <h2 className="content-player-related-title">{t("courseDetails.relatedContent")}</h2>
        </div>
      )}
      {searchError && searchErrorObj && (
        <div className="min-h-[392px] flex items-center justify-center rounded-[1.25rem] border border-border bg-white/50 px-6">
          <PageLoader error={searchErrorObj.message} onRetry={() => searchRefetch()} fullPage={false} />
        </div>
      )}
      {!searchError && searchFetching && relatedContentItems.length === 0 && (
        <div className="min-h-[392px] flex items-center justify-center rounded-[1.25rem] border border-border bg-white/50 px-6">
          <PageLoader message={t("loading")} fullPage={false} />
        </div>
      )}
      {!searchError && (relatedContentItems.length > 0 || !searchFetching) && (
        <RelatedContent items={relatedContentItems} cardType="collection" />
      )}
    </section>
  );
}
