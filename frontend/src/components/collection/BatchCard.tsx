import { useState } from "react";
import { FiPlus, FiLoader, FiAward, FiCalendar, FiEdit2, FiLock } from "react-icons/fi";
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
type ActiveTab = "Ongoing" | "Upcoming" | "Expired";

const STATUS_MAP: Record<string, BatchStatus> = {
  "0": "Upcoming",
  "1": "Ongoing",
  "2": "Expired",
};

const STATUS_STYLES: Record<BatchStatus, string> = {
  Upcoming: "bg-yellow-100 text-yellow-700",
  Ongoing:  "bg-green-100 text-green-700",
  Expired:  "bg-gray-100  text-gray-500",
};

function getBatchStatus(status: string): BatchStatus {
  return STATUS_MAP[status] ?? "Expired";
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("DD MMM YYYY") : "—";
}

/* ── Single batch row card ── */

interface BatchRowProps {
  batch: Batch;
  onEditClick: (batch: Batch) => void;
  onCertificateClick: (batch: Batch) => void;
}

const BatchRow = ({ batch, onEditClick, onCertificateClick }: BatchRowProps) => {
  const status = getBatchStatus(batch.status);
  const hasCertTemplate =
    batch.certTemplates != null && Object.keys(batch.certTemplates).length > 0;

  const today = dayjs().startOf("day");

  // Batch can only be edited if startDate has NOT yet passed (today included)
  const batchEditable = !batch.startDate || !dayjs(batch.startDate).isBefore(today);


  // Lock cert modifications after the batch end date has passed
  const certLocked =
    !!batch.endDate && dayjs(batch.endDate).isBefore(today);

  return (
    <div className="rounded-xl border border-border bg-white p-4 flex flex-col gap-2 hover:shadow-sm transition-shadow">
      {/* Name row */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-foreground font-['Rubik'] leading-snug flex-1">
          {batch.name}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              "inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5 font-['Rubik']",
              STATUS_STYLES[status]
            )}
          >
            {status}
          </span>
          {/* Edit — disabled if start date has passed */}
          {batchEditable ? (
            <button
              type="button"
              onClick={() => onEditClick(batch)}
              title="Edit batch"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-sunbird-brick hover:bg-sunbird-brick/8 transition-colors"
            >
              <FiEdit2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span
              title="Batch cannot be edited after the start date has passed"
              className="p-1.5 rounded-lg text-muted-foreground/40 cursor-not-allowed"
            >
              <FiLock className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-['Rubik']">
        <FiCalendar className="w-3 h-3 shrink-0 text-sunbird-brick/70" />
        <span>
          {formatDate(batch.startDate)} – {formatDate(batch.endDate)}
        </span>
        {batch.enrollmentEndDate && (
          <>
            <span className="text-border">·</span>
            <span>Enrolment ends {formatDate(batch.enrollmentEndDate)}</span>
          </>
        )}
      </div>

      {/* Certificate action */}
      <div className="flex items-center gap-1.5 pt-0.5 border-t border-border/60">
        <FiAward className="w-3.5 h-3.5 text-sunbird-brick shrink-0" />
        {certLocked ? (
          <span
            className="flex items-center gap-1 text-xs text-muted-foreground font-['Rubik'] cursor-not-allowed"
            title="Certificate cannot be modified after the batch end date"
          >
            <FiLock className="w-3 h-3" />
            {hasCertTemplate ? "Certificate Locked" : "Certificate Unavailable"}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onCertificateClick(batch)}
            className="text-xs text-sunbird-brick font-medium font-['Rubik'] hover:underline"
          >
            {hasCertTemplate ? "Edit Certificate" : "Add Certificate"}
          </button>
        )}
      </div>
    </div>
  );
};


/* ── Tab bar ── */

const TABS: ActiveTab[] = ["Ongoing", "Upcoming", "Expired"];

interface TabBarProps {
  activeTab: ActiveTab;
  counts: Record<ActiveTab, number>;
  onChange: (tab: ActiveTab) => void;
}

function TabBar({ activeTab, counts, onChange }: TabBarProps) {
  return (
    <div className="flex border-b border-border">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "flex-1 py-2.5 text-sm font-['Rubik'] font-medium relative transition-colors",
            activeTab === tab
              ? "text-sunbird-brick"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab}
          {counts[tab] > 0 && (
            <span
              className={cn(
                "ml-1.5 inline-flex items-center justify-center rounded-full text-xs w-4 h-4 font-['Rubik']",
                activeTab === tab
                  ? "bg-sunbird-brick text-white"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              {counts[tab]}
            </span>
          )}
          {/* active indicator */}
          {activeTab === tab && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sunbird-brick rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );
}

/* ── BatchCard ── */

const BatchCard = ({ collectionId, collectionName }: BatchCardProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editBatch, setEditBatch]   = useState<Batch | null>(null);
  const [certBatch, setCertBatch]   = useState<Batch | null>(null);
  const [activeTab, setActiveTab]   = useState<ActiveTab>("Ongoing");

  const { data: batches, isLoading, isError } = useBatchList(collectionId);

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
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            title="Create batch"
            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-sunbird-brick text-sunbird-brick hover:bg-sunbird-brick hover:text-white transition-colors"
          >
            <FiPlus className="w-4 h-4" />
          </button>
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
          existingCertTemplates={certBatch.certTemplates}
        />
      )}
    </>
  );
};

export default BatchCard;
