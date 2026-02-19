import { useState } from "react";
import { FiPlus, FiLoader, FiAward, FiCalendar, FiChevronDown, FiEdit2 } from "react-icons/fi";
import dayjs from "dayjs";
import CreateBatchModal from "./CreateBatchModal";
import AddCertificateModal from "./AddCertificateModal";
import { useBatchList } from "@/hooks/useBatch";
import { Batch } from "@/services/BatchService";
import { cn } from "@/lib/utils";

interface BatchCardProps {
  collectionId: string;
  collectionName?: string;
}

/* ── Status helpers ── */

type BatchStatus = "Upcoming" | "Ongoing" | "Expired";

const STATUS_MAP: Record<string, BatchStatus> = {
  "0": "Upcoming",
  "1": "Ongoing",
  "2": "Expired",
};

const STATUS_STYLES: Record<BatchStatus, string> = {
  Upcoming: "bg-yellow-100 text-yellow-700",
  Ongoing: "bg-green-100 text-green-700",
  Expired: "bg-gray-100 text-gray-500",
};

function getBatchStatus(status: string): BatchStatus {
  return STATUS_MAP[status] ?? "Expired";
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("DD MMM YYYY") : "—";
}

/* ── BatchListItem — detail panel for a single batch ── */

interface BatchListItemProps {
  batch: Batch;
  collectionId: string;
  collectionName?: string;
  onEditClick: (batch: Batch) => void;
  onCertificateClick: (batch: Batch) => void;
}

const BatchListItem = ({
  batch,
  collectionId,
  collectionName,
  onEditClick,
  onCertificateClick,
}: BatchListItemProps) => {
  const status = getBatchStatus(batch.status);
  const hasCertTemplate =
    batch.certTemplates != null && Object.keys(batch.certTemplates).length > 0;

  return (
    <div className="py-3 px-4 flex flex-col gap-1.5">
      {/* Name + status badge + edit button */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-foreground font-['Rubik'] leading-snug flex-1">
          {batch.name}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              "inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5 font-['Rubik']",
              STATUS_STYLES[status]
            )}
          >
            {status}
          </span>
          <button
            type="button"
            onClick={() => onEditClick(batch)}
            title="Edit batch"
            className="p-1 rounded text-muted-foreground hover:text-sunbird-brick hover:bg-sunbird-brick/5 transition-colors"
          >
            <FiEdit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Start – End dates */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground font-['Rubik']">
        <FiCalendar className="w-3 h-3 shrink-0" />
        <span>
          {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
        </span>
      </div>

      {/* Enrolment end date */}
      {batch.enrollmentEndDate && (
        <div className="text-xs text-muted-foreground font-['Rubik']">
          Enrolment ends: {formatDate(batch.enrollmentEndDate)}
        </div>
      )}

      {/* Certificate action */}
      <div className="flex items-center gap-1 mt-0.5">
        <FiAward className="w-3 h-3 text-sunbird-brick shrink-0" />
        {hasCertTemplate ? (
          <button
            type="button"
            onClick={() => onCertificateClick(batch)}
            className="text-xs text-sunbird-brick font-medium font-['Rubik'] hover:underline"
          >
            Edit Certificate
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onCertificateClick(batch)}
            className="text-xs text-sunbird-brick font-medium font-['Rubik'] hover:underline"
          >
            Add Certificate
          </button>
        )}
      </div>
    </div>
  );
};

/* ── BatchCard ── */

const BatchCard = ({ collectionId, collectionName }: BatchCardProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [certBatch, setCertBatch] = useState<Batch | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const { data: batches, isLoading, isError } = useBatchList(collectionId);

  const count = batches?.length ?? 0;
  const hasMultiple = count > 1;

  // Resolve which batch to display in the detail panel
  const displayedBatch =
    batches?.find((b) => b.id === selectedBatchId) ?? batches?.[0] ?? null;

  const handleEditClick = (batch: Batch) => {
    setEditBatch(batch);
  };

  const handleCertificateClick = (batch: Batch) => {
    setCertBatch(batch);
  };

  return (
    <>
      <div className="w-full bg-white rounded-2xl shadow-[0_0.125rem_0.75rem_rgba(0,0,0,0.08)] border border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs text-muted-foreground font-['Rubik'] leading-tight">
            Manage batches for this course
          </p>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <FiLoader className="w-5 h-5 text-muted-foreground animate-spin" />
          </div>
        )}

        {/* ── Error ── */}
        {!isLoading && isError && (
          <p className="text-xs text-red-500 font-['Rubik'] px-5 py-3">
            Failed to load batches.
          </p>
        )}

        {/* ── Empty ── */}
        {!isLoading && !isError && count === 0 && (
          <p className="text-xs text-muted-foreground font-['Rubik'] px-5 py-3">
            No batches created yet.
          </p>
        )}

        {/* ── Multiple batches → dropdown + detail panel ── */}
        {!isLoading && !isError && hasMultiple && (
          <>
            {/* Dropdown */}
            <div className="px-4 pt-3 pb-2">
              <div className="relative">
                <select
                  aria-label="Select batch"
                  value={selectedBatchId ?? displayedBatch?.id ?? ""}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-white px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sunbird-brick/40 font-['Rubik'] cursor-pointer"
                >
                  {batches!.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name} — {getBatchStatus(batch.status)}
                    </option>
                  ))}
                </select>
                <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Selected batch detail */}
            {displayedBatch && (
              <div className="border-t border-border">
                <BatchListItem
                  batch={displayedBatch}
                  collectionId={collectionId}
                  collectionName={collectionName}
                  onEditClick={handleEditClick}
                  onCertificateClick={handleCertificateClick}
                />
              </div>
            )}
          </>
        )}

        {/* ── Single batch → detail panel directly (no dropdown) ── */}
        {!isLoading && !isError && count === 1 && displayedBatch && (
          <BatchListItem
            batch={displayedBatch}
            collectionId={collectionId}
            collectionName={collectionName}
            onEditClick={handleEditClick}
            onCertificateClick={handleCertificateClick}
          />
        )}

        {/* ── Create Batch button — always visible ── */}
        <div className="px-5 py-4 border-t border-border mt-auto">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-sunbird-brick hover:bg-opacity-90 transition-colors rounded-lg px-3 py-1.5"
          >
            <FiPlus className="w-4 h-4" />
            Create Batch
          </button>
        </div>
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
        onOpenChange={(open) => { if (!open) setEditBatch(null); }}
        collectionId={collectionId}
        initialBatch={editBatch ?? undefined}
      />

      {/* Add / Edit certificate modal */}
      {certBatch && (
        <AddCertificateModal
          open={!!certBatch}
          onOpenChange={(open) => { if (!open) setCertBatch(null); }}
          courseId={collectionId}
          batchId={certBatch.id}
          courseName={collectionName}
        />
      )}
    </>
  );
};

export default BatchCard;
