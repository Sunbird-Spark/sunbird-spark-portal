import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiArrowRight, FiStar, FiShare2 } from "react-icons/fi";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import PageLoader from "@/components/common/PageLoader";
import FAQSection from "@/components/landing/FAQSection";
import { useAppI18n } from "@/hooks/useAppI18n";
import { useCollection } from "@/hooks/useCollection";
import { useContentSearch } from "@/hooks/useContent";
import { mapSearchContentToRelatedItems } from "@/services/collection";
import CollectionOverview from "@/components/collection/CollectionOverview";
import CollectionSidebar from "@/components/collection/CollectionSidebar";
import { CourseCard, type ContentCourse } from "@/components/common/CourseCard";
import { ResourceCardComponent, type ResourceCardProps } from "@/components/landing/ResourceCenter";
import defaultCollectionImage from "@/assets/resource-robot-hand.svg";
import defaultRelatedCardImage from "@/assets/resource-vr.svg";
import defaultResourceCardImage from "@/assets/circuit-board-glowing.svg";
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

  const relatedItemsFromSearch = useMemo(
    () => mapSearchContentToRelatedItems(searchData?.data?.content, collectionData?.id ?? undefined, 3),
    [searchData?.data?.content, collectionData?.id]
  );
  const relatedItems = useMemo(
    () =>
      relatedItemsFromSearch.length > 0 ? relatedItemsFromSearch : (collectionData?.relatedContent ?? []),
    [relatedItemsFromSearch, collectionData?.relatedContent]
  );

  const initialExpanded = useMemo(() => {
    const first = collectionData?.modules?.[0];
    return first ? [first.id] : [];
  }, [collectionData?.modules]);

  const expandedModulesList = expandedModules.length > 0 ? expandedModules : initialExpanded;

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="container mx-auto px-4 py-6">
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
          <span className="flex items-center gap-1">
            {collectionData.rating}
            <FiStar className="w-3.5 h-3.5 text-sunbird-brick fill-sunbird-brick" />
          </span>
          <span className="text-gray-300">•</span>
          <span>{collectionData.learners} {t("contentStats.learners")}</span>
          <span className="text-gray-300">•</span>
          <span>{collectionData.lessons} {t("contentStats.lessons")}</span>
          <button
            type="button"
            aria-label={t("button.share")}
            className="flex items-center gap-2 text-sunbird-brick text-sm font-medium hover:opacity-80 transition-opacity"
            onClick={() => { /* TODO: implement share */ }}
          >
            <FiShare2 className="w-4 h-4" />
            {t("button.share")}
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          {/* Left Column */}
          <CollectionOverview collectionData={displayCollectionData} />

          {/* Right Sidebar - Lessons Accordion */}
          <div className="lg:sticky lg:top-6 h-fit max-h-[calc(100vh_-_120px)] overflow-y-scroll pr-3 custom-scrollbar">
            <CollectionSidebar
              modules={collectionData.modules}
              expandedModules={expandedModulesList}
              toggleModule={toggleModule}
              collectionId={collectionId}
            />
          </div>

        </div>

        {/* Related Content Section */}
        <section className="mt-16">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-semibold text-foreground">{t("courseDetails.relatedContent")}</h2>
            <FiArrowRight className="w-5 h-5 text-sunbird-brick" />
          </div>

          {searchError && searchErrorObj && (
            <div className="min-h-[392px] flex items-center justify-center rounded-[1.25rem] border border-border bg-white/50 px-6">
              <PageLoader
                error={searchErrorObj.message}
                onRetry={() => searchRefetch()}
                fullPage={false}
              />
            </div>
          )}

          {!searchError && searchFetching && relatedItems.length === 0 && (
            <div className="min-h-[392px] flex items-center justify-center rounded-[1.25rem] border border-border bg-white/50 px-6">
              <PageLoader message={t("loading")} fullPage={false} />
            </div>
          )}

          {!searchError && (relatedItems.length > 0 || !searchFetching) && (
          <>
          <div className="related-content-grid">
            {relatedItems.map((item) => {
              const resourceCardImage = item.image || defaultResourceCardImage;
              const courseCardImage = item.image || defaultRelatedCardImage;
              return (
                <div key={item.id} className="related-content-card-cell">
                  {item.isResource ? (
                    <ResourceCardComponent
                      id={item.id}
                      title={item.title}
                      type={(item.type === "Video" || item.type === "PDF" || item.type === "HTML" || item.type === "Epub" ? item.type : "PDF") as ResourceCardProps["type"]}
                      image={resourceCardImage}
                      heightClass="h-[392px]"
                    />
                  ) : (
                    <CourseCard
                      course={
                        {
                          id: item.id,
                          title: item.title,
                          image: courseCardImage,
                          type: item.type,
                          rating: item.rating ?? 0,
                          learners: item.learners ?? "0",
                          lessons: item.lessons ?? 0,
                        } as ContentCourse
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Carousel Navigation - TODO: implement carousel when related content section is enhanced */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              type="button"
              aria-label={t("button.previous")}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
              onClick={() => { /* TODO: implement carousel previous */ }}
            >
              <FiArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-gray-800 rounded-full" />
              <div className="w-6 h-1 bg-gray-300 rounded-full" />
            </div>
            <button
              type="button"
              aria-label={t("button.next")}
              className="w-8 h-8 rounded-full bg-sunbird-brick flex items-center justify-center hover:bg-sunbird-brick/90 transition-colors"
              onClick={() => { /* TODO: implement carousel next */ }}
            >
              <FiArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
          </>
          )}
        </section>
        <FAQSection className="bg-gray-100" />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CollectionDetailPage;
