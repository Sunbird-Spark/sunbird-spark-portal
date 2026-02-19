import { useState } from "react";
import { FiPlus, FiLoader, FiAward, FiCalendar } from "react-icons/fi";
import dayjs from "dayjs";
import CreateBatchModal from "./CreateBatchModal";
import { useBatchList } from "@/hooks/useBatch";
import { Batch } from "@/services/BatchService";
import { cn } from "@/lib/utils";

interface BatchCardProps {
  collectionId: string;
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

/* ── BatchListItem ── */

interface BatchListItemProps {
  batch: Batch;
}

const BatchListItem = ({ batch }: BatchListItemProps) => {
  const status = getBatchStatus(batch.status);
  const hasCertTemplate =
    batch.certTemplates != null &&
    Object.keys(batch.certTemplates).length > 0;

  return (
    <div className="py-3 px-4 flex flex-col gap-1.5 border-b border-border last:border-b-0">
      {/* Batch name + status badge */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-foreground font-['Rubik'] leading-snug flex-1">
          {batch.name}
        </span>
        <span
          className={cn(
            "inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5 shrink-0 font-['Rubik']",
            STATUS_STYLES[status]
          )}
        >
          {status}
        </span>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground font-['Rubik']">
        <FiCalendar className="w-3 h-3 shrink-0" />
        <span>
          {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
        </span>
      </div>

      {/* Enrolment End Date */}
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
            className="text-xs text-sunbird-brick font-medium font-['Rubik'] hover:underline"
          >
            Edit Certificate
          </button>
        ) : (
          <button
            type="button"
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

const BatchCard = ({ collectionId }: BatchCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: batches, isLoading, isError } = useBatchList(collectionId);

  const hasBatches = (batches?.length ?? 0) > 0;

  return (
    <>
      <div className="w-full bg-white rounded-2xl shadow-[0_0.125rem_0.75rem_rgba(0,0,0,0.08)] border border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs text-muted-foreground font-['Rubik'] leading-tight">
            Manage batches for this course
          </p>
        </div>

        {/* Batch list */}
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <FiLoader className="w-5 h-5 text-muted-foreground animate-spin" />
          </div>
        )}

        {!isLoading && isError && (
          <p className="text-xs text-red-500 font-['Rubik'] px-5 py-3">
            Failed to load batches.
          </p>
        )}

        {!isLoading && !isError && hasBatches && (
          <div className="divide-y divide-border">
            {batches!.map((batch) => (
              <BatchListItem key={batch.id} batch={batch} />
            ))}
          </div>
        )}

        {!isLoading && !isError && !hasBatches && (
          <p className="text-xs text-muted-foreground font-['Rubik'] px-5 py-3">
            No batches created yet.
          </p>
        )}

        {/* Create Batch button — always visible */}
        <div className="px-5 py-4">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-sunbird-brick hover:bg-opacity-90 transition-colors rounded-lg px-3 py-1.5 self-start"
          >
            <FiPlus className="w-4 h-4" />
            Create Batch
          </button>
        </div>
      </div>

      <CreateBatchModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        collectionId={collectionId}
      />
    </>
  );
};

export default BatchCard;
