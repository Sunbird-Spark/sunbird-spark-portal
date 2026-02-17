import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import PageLoader from "@/components/common/PageLoader";
import FAQSection from "@/components/landing/FAQSection";
import RelatedContent from "@/components/common/RelatedContent";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useCollection } from "@/hooks/useCollection";
import { useContentSearch } from "@/hooks/useContent";
import { mapSearchContentToRelatedContentItems } from "@/services/collection";
import CollectionOverview from "@/components/collection/CollectionOverview";
import CollectionSidebar from "@/components/collection/CollectionSidebar";
import defaultCollectionImage from "@/assets/resource-robot-hand.svg";
import "./collection.css";

const CollectionDetailPage = () => {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const { t } = useAppI18n();
  const { data: collectionDataFromApi, isLoading, isFetching, isError, error, refetch } = useCollection(collectionId);
  const showLoading = isLoading || (isError && isFetching);
  const hierarchySuccess = !isError && !!collectionDataFromApi;
  const collectionData = collectionDataFromApi ?? null;
  const displayCollectionData = useMemo(
    () =>
      collectionData
        ? { ...collectionData, image: collectionData.image || defaultCollectionImage }
        : null,
    [collectionData]
  );
  const {
    data: searchData,
    isError: searchError,
    error: searchErrorObj,
    refetch: searchRefetch,
    isFetching: searchFetching,
  } = useContentSearch({
    request: { limit: 20, offset: 0 },
    enabled: hierarchySuccess,
  });
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const initialExpandedSet = useRef(false);

  useEffect(() => {
    const firstId = collectionData?.modules?.[0]?.id;
    if (firstId && !initialExpandedSet.current) {
      setExpandedModules([firstId]);
      initialExpandedSet.current = true;
    }
  }, [collectionData?.modules]);

  useEffect(() => {
    initialExpandedSet.current = false;
    setExpandedModules([]);
  }, [collectionId]);

  const hasSearchResults = (searchData?.data?.content?.length ?? 0) > 0;

  const relatedContentItems = useMemo(() => {
    if (hasSearchResults) {
      return mapSearchContentToRelatedContentItems(
        searchData?.data?.content,
        collectionData?.id ?? undefined,
        3
      );
    }
    return [];
  }, [hasSearchResults, searchData?.data?.content, collectionData?.id]);


  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Go Back Link - always visible */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sunbird-brick text-sm font-medium mb-6 hover:opacity-80 transition-opacity"
        >
          <FiArrowLeft className="w-4 h-4" />
          {t("button.goBack")}
        </button>

        {showLoading && (
          <PageLoader message={t("loading")} fullPage={false} />
        )}

        {!showLoading && isError && error && (
          <PageLoader
            error={error.message}
            onRetry={() => refetch()}
            fullPage={false}
          />
        )}

        {!showLoading && !isError && collectionDataFromApi == null && (
          <PageLoader
            error="Collection not found."
            onRetry={() => refetch()}
            fullPage={false}
          />
        )}

        {!showLoading && hierarchySuccess && collectionData && displayCollectionData && (
          <>
        {/* Title Row */}
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground max-w-[75%]">
            {collectionData.title}
          </h1>

        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <span>{collectionData.lessons} {t("contentStats.lessons")}</span>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          {/* Left Column */}
          <CollectionOverview collectionData={displayCollectionData} />

          {/* Right Sidebar - Lessons Accordion */}
          <div className="lg:sticky lg:top-6 h-fit max-h-[calc(100vh_-_120px)] overflow-y-scroll pr-3 custom-scrollbar">
            <CollectionSidebar
              modules={collectionData.modules}
              expandedModules={expandedModules}
              toggleModule={toggleModule}
              collectionId={collectionId}
            />
          </div>

        </div>

        {/* Related Content Section */}
        <section className="mt-16">
          {(searchError || (searchFetching && relatedContentItems.length === 0)) && (
            <div className="content-player-related-header mb-6">
              <h2 className="content-player-related-title">{t("courseDetails.relatedContent")}</h2>
            </div>
          )}
          {searchError && searchErrorObj && (
            <div className="min-h-[392px] flex items-center justify-center rounded-[1.25rem] border border-border bg-white/50 px-6">
              <PageLoader
                error={searchErrorObj.message}
                onRetry={() => searchRefetch()}
                fullPage={false}
              />
            </div>
          )}

          {!searchError && searchFetching && relatedContentItems.length === 0 && (
            <div className="min-h-[392px] flex items-center justify-center rounded-[1.25rem] border border-border bg-white/50 px-6">
              <PageLoader message={t("loading")} fullPage={false} />
            </div>
          )}

          {!searchError && (relatedContentItems.length > 0 || !searchFetching) && (
            <RelatedContent
              items={relatedContentItems}
              cardType="collection"
            />
          )}
        </section>
        <div className="mt-16">
          <FAQSection />
        </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CollectionDetailPage;
