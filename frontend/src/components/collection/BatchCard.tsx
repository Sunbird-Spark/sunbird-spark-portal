import { useState } from "react";
import { FiPlus, FiRefreshCw, FiLoader, FiCalendar } from "react-icons/fi";
import CreateBatchModal from "./CreateBatchModal";
import AddCertificateModal from "./AddCertificateModal";
import { useBatchListForCreator, useBatchListForMentor, mergeBatches } from "@/hooks/useBatch";
import { Batch } from "@/services/BatchService";
import { cn } from "@/lib/utils";
import { TncCheckboxRow } from "@/components/collection/TncCheckboxRow";
import { useSystemSetting } from "@/hooks/useSystemSetting";
import { useAcceptTnc } from "@/hooks/useTnc";
import { useToast } from "@/hooks/useToast";
import { useIsContentCreator, useIsMentor } from "@/hooks/useUser";
import { usePermissions } from "@/hooks/usePermission";
import { useAppI18n } from "@/hooks/useAppI18n";
import useInteract from "@/hooks/useInteract";

interface BatchCardProps {
  collectionId: string;
  collectionName?: string;
}

import { BatchRow, getBatchStatus } from "./BatchRow";
import { TabBar, ActiveTab } from "./BatchTabBar";

/* ── BatchCard ── */

const BatchCard = ({ collectionId, collectionName }: BatchCardProps) => {
  const { toast } = useToast();
  const { t } = useAppI18n();
  const { interact } = useInteract();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editBatch, setEditBatch]   = useState<Batch | null>(null);
  const [certBatch, setCertBatch]   = useState<Batch | null>(null);
  const [activeTab, setActiveTab]   = useState<ActiveTab>("Ongoing");

  /* ── Reviewer TnC state ── */
  const isContentCreator = useIsContentCreator();
  const isMentor         = useIsMentor();
  const { hasAnyRole } = usePermissions();
  const isReviewer = hasAnyRole(['CONTENT_REVIEWER']) && !isContentCreator;
  const [reviewerTncChecked, setReviewerTncChecked] = useState(false);
  const [reviewerTncAccepted, setReviewerTncAccepted] = useState(false);

  const { data: reportViewerTncConfig, isSuccess: isReviewerTncSuccess } =
    useSystemSetting(isReviewer ? "reportViewerTnc" : "");
  const acceptTncMutation = useAcceptTnc();

  const handleAcceptReviewerTnc = async () => {
    if (!reviewerTncChecked || !isReviewerTncSuccess || !reportViewerTncConfig) return;
    try {
      await acceptTncMutation.mutateAsync({
        tncConfig: reportViewerTncConfig,
        tncType: "reportViewerTnc",
      });
      setReviewerTncAccepted(true);
      toast({ title: "Terms accepted", description: "You can now view batch reports.", variant: "success" });
    } catch {
      toast({ title: "Failed to accept Terms", description: "Please try again.", variant: "destructive" });
    }
  };

  const { data: creatorBatches, isLoading: isLoadingCreator, isError: isErrorCreator, refetch: refetchCreator, isFetching: isFetchingCreator } = useBatchListForCreator(collectionId, { enabled: isContentCreator });
  const { data: mentorBatches,  isLoading: isLoadingMentor,  isError: isErrorMentor,  refetch: refetchMentor,  isFetching: isFetchingMentor  } = useBatchListForMentor(collectionId, { enabled: isMentor });

  const batches = mergeBatches(creatorBatches, mentorBatches);

  const isLoading = (isContentCreator && isLoadingCreator) || (isMentor && isLoadingMentor);
  const isError   = (isContentCreator && isErrorCreator)   || (isMentor && isErrorMentor);
  const isFetching = (isContentCreator && isFetchingCreator) || (isMentor && isFetchingMentor);

  const refetch = () => {
    if (isContentCreator) refetchCreator();
    if (isMentor) refetchMentor();
  };


  /* ── Per-tab filtered lists ── */
  const ongoing  = batches?.filter((b) => getBatchStatus(b.status) === "Ongoing")  ?? [];
  const upcoming = batches?.filter((b) => getBatchStatus(b.status) === "Upcoming") ?? [];
  const expired  = batches?.filter((b) => getBatchStatus(b.status) === "Expired")  ?? [];

  const counts: Record<ActiveTab, number> = {
    Ongoing:  ongoing.length,
    Upcoming: upcoming.length,
    Expired:  expired.length,
  };

  const tabBatches: Record<ActiveTab, Batch[]> = {
    Ongoing:  ongoing,
    Upcoming: upcoming,
    Expired:  expired,
  };

  const currentBatches = tabBatches[activeTab];

  const handleEditClick        = (batch: Batch) => setEditBatch(batch);
  const handleCertificateClick = (batch: Batch) => setCertBatch(batch);

  return (
    <>
      <div className="w-full bg-white rounded-2xl shadow-[0_0.125rem_0.75rem_rgba(0,0,0,0.08)] border border-border flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground font-['Rubik']">
            Manage batches for this course
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh batch list"
              data-edataid="batch-list-refresh"
              data-pageid="course-consumption"
              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-sunbird-brick text-sunbird-brick hover:bg-sunbird-brick hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
            </button>
            {isContentCreator && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                title="Create batch"
                data-edataid="batch-create-open"
                data-pageid="course-consumption"
                className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-sunbird-brick text-sunbird-brick hover:bg-sunbird-brick hover:text-white transition-colors"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Reviewer TnC acceptance (shown until accepted) ── */}
        {isReviewer && !reviewerTncAccepted && (
          <div className="px-4 pt-4 pb-0">
            <div className="rounded-lg bg-gray-50 border border-border p-4 space-y-3">
              <TncCheckboxRow
                checked={reviewerTncChecked}
                onCheckedChange={(v) => setReviewerTncChecked(!!v)}
                settingKey="reportViewerTnc"
                label="to view batch reports."
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!reviewerTncChecked || acceptTncMutation.isPending}
                  onClick={handleAcceptReviewerTnc}
                  data-edataid="report-viewer-tnc-accept"
                  data-pageid="course-consumption"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white font-['Rubik'] transition-colors",
                    !reviewerTncChecked || acceptTncMutation.isPending
                      ? "bg-sunbird-brick/40 cursor-not-allowed"
                      : "bg-sunbird-brick hover:bg-opacity-90"
                  )}
                >
                  {acceptTncMutation.isPending && <FiLoader className="w-4 h-4 animate-spin" />}
                  {acceptTncMutation.isPending ? t('tncPopup.accepting') : t('tncPopup.acceptAndContinue')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        {!isLoading && !isError && (
          <TabBar activeTab={activeTab} counts={counts} onChange={(tab) => {
            interact({
              id: 'batch-tab-switch',
              type: 'CLICK',
              pageid: 'course-consumption',
              cdata: [{ id: tab, type: 'Tab' }]
            });
            setActiveTab(tab);
          }} />
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <FiLoader className="w-5 h-5 text-muted-foreground animate-spin" />
          </div>
        )}

        {/* ── Error ── */}
        {!isLoading && isError && (
          <p className="text-xs text-red-500 font-['Rubik'] px-5 py-4">
            Failed to load batches.
          </p>
        )}

        {/* ── Tab content ── */}
        {!isLoading && !isError && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0 max-h-[18rem]">
            {currentBatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <FiCalendar className="w-7 h-7" />
                <p className="text-xs font-['Rubik']">
                  No {activeTab.toLowerCase()} batches
                </p>
              </div>
            ) : (
              currentBatches.map((batch) => (
                <BatchRow
                  key={batch.id}
                  batch={batch}
                  onEditClick={handleEditClick}
                  onCertificateClick={handleCertificateClick}
                  canManageCertificates={isContentCreator}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Create batch modal */}
      <CreateBatchModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        collectionId={collectionId}
      />

      {/* Edit batch modal */}
      <CreateBatchModal
        open={!!editBatch}
        onOpenChange={(open: boolean) => { if (!open) setEditBatch(null); }}
        collectionId={collectionId}
        initialBatch={editBatch ?? undefined}
      />

      {/* Add / Edit certificate modal */}
      {certBatch && (
        <AddCertificateModal
          open={!!certBatch}
          onOpenChange={(open: boolean) => { if (!open) setCertBatch(null); }}
          courseId={collectionId}
          batchId={certBatch.id}
          courseName={collectionName}
          existingCertTemplates={certBatch.certTemplates}
        />
      )}
    </>
  );
};

export default BatchCard;
