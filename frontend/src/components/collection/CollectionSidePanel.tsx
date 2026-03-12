import { useNavigate } from "react-router-dom";
import { FiLayout } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import CollectionSidebar from "@/components/collection/CollectionSidebar";
import BatchCard from "@/components/collection/BatchCard";
import LoginToUnlockCard from "@/components/collection/LoginToUnlockCard";
import LearnerBottomCards from "@/components/collection/LearnerBottomCards";
import type { CollectionContentAreaAccessProps } from "./CollectionContentArea";
import type { CollectionContentAreaEnrollmentProps } from "./CollectionContentArea";
import type { CollectionContentAreaSidebarProps } from "./CollectionContentArea";

interface CollectionSidePanelProps {
  contentId: string | undefined;
  access: CollectionContentAreaAccessProps;
  enrollment: CollectionContentAreaEnrollmentProps;
  sidebar: CollectionContentAreaSidebarProps;
  creator: {
    isCreatorViewingOwnCollection: boolean;
    contentCreatorPrivilege: boolean;
    userProfile: Record<string, unknown> | null;
  };
  collectionData: { title: string; children: any[]; channel?: string; userConsent?: string };
  leftColHeight: number | undefined;
  showCertificateCard: boolean;
  showBottomSections: boolean;
  showProfileDataSharingCard: boolean;
  backTo: string;
}

export default function CollectionSidePanel({
  contentId,
  access,
  enrollment,
  sidebar,
  creator,
  collectionData,
  leftColHeight,
  showCertificateCard,
  showBottomSections,
  showProfileDataSharingCard,
  backTo,
}: CollectionSidePanelProps) {
  const {
    isTrackable,
    isAuthenticated,
    hasBatchInRoute,
    isEnrolledInCurrentBatch,
    contentBlocked,
  } = access;
  const {
    contentStatusMap,
    contentAttemptInfoMap,
    batches,
    selectedBatchId,
    setSelectedBatchId,
    handleJoinCourse,
    batchListLoading,
    joinLoading,
    batchListError,
    joinError,
    hasCertificate,
    firstCertPreviewUrl,
    setCertificatePreviewUrl,
    setCertificatePreviewOpen,
  } = enrollment;
  const { expandedModules, toggleModule, collectionId, batchIdParam } = sidebar;
  const {
    isCreatorViewingOwnCollection,
    contentCreatorPrivilege,
    userProfile,
  } = creator;
  const navigate = useNavigate();

  const certPreviewClick = () => {
    if (firstCertPreviewUrl) {
      setCertificatePreviewUrl(firstCertPreviewUrl);
      setCertificatePreviewOpen(true);
    }
  };

  return (
    <aside
      className="flex flex-col overflow-hidden"
      style={leftColHeight != null ? { maxHeight: leftColHeight } : undefined}
    >
      {isTrackable && isAuthenticated && isCreatorViewingOwnCollection && collectionId && (
        <div className="flex flex-col gap-3 mb-4">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 font-['Rubik'] text-sunbird-brick border-sunbird-brick hover:bg-sunbird-brick/5 bg-white shadow-sm"
            onClick={() => navigate(`/collection/${collectionId}/dashboard/batches`, { state: { from: backTo } })}
            data-testid="view-dashboard-btn"
          >
            <FiLayout className="w-4 h-4" />
            View Course Dashboard
          </Button>
          <BatchCard collectionId={collectionId} collectionName={collectionData.title} />
        </div>
      )}

      {contentBlocked && !isAuthenticated && (
        <div className="mb-4">
          <LoginToUnlockCard />
        </div>
      )}

      <div className="min-h-0 overflow-y-scroll custom-scrollbar">
        <CollectionSidebar
          collectionId={collectionId ?? ''}
          batchId={hasBatchInRoute ? batchIdParam ?? null : null}
          children={collectionData.children}
          expandedMainUnitIds={expandedModules}
          toggleMainUnit={toggleModule}
          activeContentId={contentId ?? null}
          contentBlocked={contentBlocked}
          contentStatusMap={hasBatchInRoute && isEnrolledInCurrentBatch && !contentCreatorPrivilege ? contentStatusMap : undefined}
          contentAttemptInfoMap={hasBatchInRoute && isEnrolledInCurrentBatch && !contentCreatorPrivilege ? contentAttemptInfoMap : undefined}
        />
      </div>

      {isTrackable && isAuthenticated && !contentCreatorPrivilege && !hasBatchInRoute && (
        <div className="mt-4 flex-shrink-0">
          <LearnerBottomCards
            hasBatchInRoute={hasBatchInRoute}
            showCertificateCard={false}
            batches={batches}
            selectedBatchId={selectedBatchId}
            setSelectedBatchId={setSelectedBatchId}
            onJoinCourse={handleJoinCourse}
            batchListLoading={batchListLoading}
            joinLoading={joinLoading}
            batchListError={batchListError}
            joinError={joinError}
            hasCertificate={hasCertificate}
            firstCertPreviewUrl={firstCertPreviewUrl}
            onCertificatePreviewClick={certPreviewClick}
            showProfileDataSharingCard={false}
            collectionId={collectionId}
            channel={collectionData?.channel}
            userProfile={userProfile ?? undefined}
          />
        </div>
      )}

      {showBottomSections && (
        <div className="flex-shrink-0 flex flex-col gap-4">
          {showCertificateCard && (
            <LearnerBottomCards
              hasBatchInRoute={hasBatchInRoute}
              showCertificateCard
              batches={batches}
              selectedBatchId={selectedBatchId}
              setSelectedBatchId={setSelectedBatchId}
              onJoinCourse={handleJoinCourse}
              batchListLoading={batchListLoading}
              joinLoading={joinLoading}
              batchListError={batchListError}
              joinError={joinError}
              hasCertificate={hasCertificate}
              firstCertPreviewUrl={firstCertPreviewUrl}
              onCertificatePreviewClick={certPreviewClick}
              showProfileDataSharingCard={false}
              collectionId={collectionId}
              channel={collectionData?.channel}
              userProfile={userProfile ?? undefined}
            />
          )}
          {showProfileDataSharingCard && (
            <LearnerBottomCards
              hasBatchInRoute={hasBatchInRoute}
              showCertificateCard={false}
              batches={batches}
              selectedBatchId={selectedBatchId}
              setSelectedBatchId={setSelectedBatchId}
              onJoinCourse={handleJoinCourse}
              batchListLoading={batchListLoading}
              joinLoading={joinLoading}
              batchListError={batchListError}
              joinError={joinError}
              hasCertificate={hasCertificate}
              firstCertPreviewUrl={firstCertPreviewUrl}
              onCertificatePreviewClick={certPreviewClick}
              showProfileDataSharingCard
              collectionId={collectionId}
              channel={collectionData?.channel}
              userProfile={userProfile ?? undefined}
            />
          )}
        </div>
      )}
    </aside>
  );
}
