import { useState } from "react";
import { FiPlus, FiRefreshCw, FiLoader, FiAward, FiCalendar, FiEdit2, FiLock } from "react-icons/fi";
import dayjs from "dayjs";
import CreateBatchModal from "./CreateBatchModal";
import AddCertificateModal from "./AddCertificateModal";
import { useBatchListForCreator } from "@/hooks/useBatch";
import { Batch } from "@/services/BatchService";
import { cn } from "@/lib/utils";

interface BatchCardProps {
  collectionId: string;
  collectionName?: string;
}

import { BatchRow, getBatchStatus } from "./BatchRow";
import { TabBar, ActiveTab } from "./BatchTabBar";

/* ── BatchCard ── */

const BatchCard = ({ collectionId, collectionName }: BatchCardProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editBatch, setEditBatch]   = useState<Batch | null>(null);
  const [certBatch, setCertBatch]   = useState<Batch | null>(null);
  const [activeTab, setActiveTab]   = useState<ActiveTab>("Ongoing");

  const { data: batches, isLoading, isError, refetch, isFetching } = useBatchListForCreator(collectionId);

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
              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-sunbird-brick text-sunbird-brick hover:bg-sunbird-brick hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
            </button>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              title="Create batch"
              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-sunbird-brick text-sunbird-brick hover:bg-sunbird-brick hover:text-white transition-colors"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        {!isLoading && !isError && (
          <TabBar activeTab={activeTab} counts={counts} onChange={setActiveTab} />
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
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0" style={{ maxHeight: "26rem" }}>
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
