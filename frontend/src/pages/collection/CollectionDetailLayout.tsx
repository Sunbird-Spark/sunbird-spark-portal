import { FiArrowLeft } from "react-icons/fi";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import PageLoader from "@/components/common/PageLoader";
import FAQSection from "@/components/landing/FAQSection";
import RelatedContentSection from "@/components/collection/RelatedContentSection";
import CollectionContentArea from "@/components/collection/CollectionContentArea";
import type {
  CollectionContentAreaAccessProps,
  CollectionContentAreaPlayerProps,
  CollectionContentAreaEnrollmentProps,
  CollectionContentAreaSidebarProps,
  CollectionContentAreaCreatorProps,
} from "@/components/collection/CollectionContentArea";
import CertificatePreviewModal, { type CertificatePreviewDetails } from "@/components/collection/CertificatePreviewModal";
import CourseCompletionDialog from "@/components/collection/CourseCompletionDialog";
import type { CourseProgressCardProps } from "@/components/collection/CourseProgressCard";
import type { CollectionData } from "@/types/collectionTypes";

/** Navigation and i18n for the layout. */
export interface CollectionDetailLayoutNavigationProps {
  onGoBack: () => void;
  t: (key: string) => string;
}

/** Loading and error state for the layout. */
export interface CollectionDetailLayoutLoadingProps {
  showLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
}

/** Collection data and hierarchy state. */
export interface CollectionDetailLayoutCollectionProps {
  collectionDataFromApi: CollectionData | null;
  hierarchySuccess: boolean;
  collectionData: CollectionData | null;
  displayCollectionData: CollectionData | null;
}

/** Full props passed through to CollectionContentArea. */
export interface CollectionDetailLayoutContentAreaProps {
  collectionData: CollectionData;
  contentId: string | undefined;
  access: CollectionContentAreaAccessProps;
  player: CollectionContentAreaPlayerProps;
  enrollment: CollectionContentAreaEnrollmentProps;
  sidebar: CollectionContentAreaSidebarProps;
  creator?: CollectionContentAreaCreatorProps;
  backTo?: string;
}

/** Certificate preview modal state and setters. */
export interface CollectionDetailLayoutCertificateModalProps {
  certificatePreviewOpen: boolean;
  certificatePreviewUrl: string;
  certificatePreviewDetails: CertificatePreviewDetails;
  setCertificatePreviewUrl: (url: string) => void;
  setCertificatePreviewOpen: (open: boolean) => void;
}

/** Related content section state. */
export interface CollectionDetailLayoutRelatedContentProps {
  searchError: boolean;
  searchErrorObj: Error | null;
  searchFetching: boolean;
  relatedContentItems: Array<{ identifier?: string; name?: string }>;
  searchRefetch: () => void;
}

/** Course completion dialog props. */
export interface CollectionDetailLayoutCourseCompletionProps {
  courseProgressProps: CourseProgressCardProps | null | undefined;
  isEnrolledInCurrentBatch: boolean;
  collectionId: string | undefined;
  hasCertificate: boolean;
}

export interface CollectionDetailLayoutProps {
  navigation: CollectionDetailLayoutNavigationProps;
  loading: CollectionDetailLayoutLoadingProps;
  collection: CollectionDetailLayoutCollectionProps;
  contentArea: CollectionDetailLayoutContentAreaProps | null | undefined;
  certificateModal: CollectionDetailLayoutCertificateModalProps;
  relatedContent: CollectionDetailLayoutRelatedContentProps;
  courseCompletion: CollectionDetailLayoutCourseCompletionProps;
}

const CollectionDetailLayout = ({
  navigation,
  loading,
  collection,
  contentArea,
  certificateModal,
  relatedContent,
  courseCompletion,
}: CollectionDetailLayoutProps) => {
  const { onGoBack, t } = navigation;
  const { showLoading, isError, error, onRetry } = loading;
  const { collectionDataFromApi, hierarchySuccess, collectionData, displayCollectionData } = collection;
  const {
    certificatePreviewOpen,
    certificatePreviewUrl,
    certificatePreviewDetails,
    setCertificatePreviewUrl: _setCertificatePreviewUrl,
    setCertificatePreviewOpen,
  } = certificateModal;
  const { searchError, searchErrorObj, searchFetching, relatedContentItems, searchRefetch } = relatedContent;
  const { courseProgressProps, isEnrolledInCurrentBatch, collectionId, hasCertificate } = courseCompletion;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Go Back Link — only shown for loading/error states.
             When the content area is visible, it renders its own Go Back inside the grid. */}
        {(showLoading || isError || collectionDataFromApi == null) && (
          <button
            onClick={onGoBack}
            className="flex items-center gap-2 text-sunbird-brick text-sm font-medium mb-6 hover:opacity-80 transition-opacity"
          >
            <FiArrowLeft className="w-4 h-4" />
            {t("button.goBack")}
          </button>
        )}

        {showLoading && <PageLoader message={t("loading")} fullPage={false} />}
        {!showLoading && isError && error && (
          <PageLoader
            error={error.message}
            onRetry={onRetry}
            fullPage={false}
          />
        )}

        {!showLoading && !isError && collectionDataFromApi == null && (
          <PageLoader
            error={t("collection.notFound")}
            onRetry={onRetry}
            fullPage={false}
          />
        )}
        {!showLoading && hierarchySuccess && collectionData && displayCollectionData && contentArea && (
          <>
            {/* Main Content Area */}
            <CollectionContentArea {...contentArea} />

            <RelatedContentSection
              searchError={searchError}
              searchErrorObj={searchErrorObj}
              searchFetching={searchFetching}
              relatedContentItems={relatedContentItems}
              searchRefetch={searchRefetch}
            />
            <div className="mt-16"><FAQSection /></div>
          </>
        )}
      </main>
      <CertificatePreviewModal
        open={certificatePreviewOpen}
        onClose={() => setCertificatePreviewOpen(false)}
        previewUrl={certificatePreviewUrl}
        details={certificatePreviewDetails}
      />
      <CourseCompletionDialog
        courseProgressProps={courseProgressProps}
        isEnrolledInCurrentBatch={isEnrolledInCurrentBatch}
        collectionId={collectionId}
        hasCertificate={hasCertificate}
      />
      <Footer />
    </div>
  );
};

export default CollectionDetailLayout;

