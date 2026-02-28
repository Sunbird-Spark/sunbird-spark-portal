import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiSearch, FiLoader } from "react-icons/fi";
import { useCreateBatch, useUpdateBatch } from "@/hooks/useBatch";
import { useMentorList, MentorUser } from "@/hooks/useMentor";
import { Batch } from "@/services/BatchService";
import { cn } from "@/lib/utils";

import { SwitchRow } from "@/components/common/Switch";
import { MentorSection } from "@/components/collection/MentorSection";
import { BatchFormFields, BatchFormState } from "@/components/collection/BatchFormFields";
import { TncCheckboxRow } from "@/components/collection/TncCheckboxRow";
import { TermsAndConditionsDialog } from "@/components/termsAndCondition/TermsAndConditionsDialog";
import { useSystemSetting } from "@/hooks/useSystemSetting";
import { useGetTncUrl } from "@/hooks/useTnc";

/* ─── Types ─── */

interface CreateBatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  /** When provided, the modal operates in Edit mode */
  initialBatch?: Batch;
}


const makeInitialForm = (batch?: Batch): BatchFormState => ({
  batchName: batch?.name ?? "",
  aboutBatch: batch?.description ?? "",
  startDate: batch?.startDate ?? "",
  endDate: batch?.endDate ?? "",
  enrolmentEndDate: batch?.enrollmentEndDate ?? "",
  issueCertificate: batch?.issueCertificate ??
    (batch?.certTemplates != null && Object.keys(batch.certTemplates).length > 0),
  enableDiscussion: false,
  batchType: "Open",
  selectedMentorIds: batch?.mentors ?? [],
  acceptTerms: false,
});

const labelClass = "block text-sm font-medium text-sunbird-obsidian mb-1 font-['Rubik']";
const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sunbird-brick/40 focus:border-sunbird-brick bg-white font-['Rubik']";

/* ─── Modal ─── */

const CreateBatchModal = ({ open, onOpenChange, collectionId, initialBatch }: CreateBatchModalProps) => {
  const isEditMode = !!initialBatch;

  const [form, setForm] = useState<BatchFormState>(() => makeInitialForm(initialBatch));
  const [mentorQuery, setMentorQuery] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tncDialogOpen, setTncDialogOpen] = useState(false);

  const { data: tncRes } = useSystemSetting("tncConfig");
  // Pass the full ApiResponse so parseTncConfig can traverse data.response.value
  // (AxiosAdapter already unwraps the `result` layer into `data`)
  const { data: termsUrl } = useGetTncUrl(tncRes ?? null);

  const { data: allMentors = [], isLoading: mentorsLoading } = useMentorList();
  const createBatch = useCreateBatch();
  const updateBatch = useUpdateBatch();

  const isPending = isEditMode ? updateBatch.isPending : createBatch.isPending;

  // Re-populate form when switching to a different batch in edit mode
  useEffect(() => {
    if (open) {
      setForm(makeInitialForm(initialBatch));
      setMentorQuery("");
      setSubmitError(null);
    }
  }, [open, initialBatch]);

  const handleField = <K extends keyof BatchFormState>(key: K, value: BatchFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMentor = (id: string) => {
    setForm((prev) => ({
      ...prev,
      selectedMentorIds: prev.selectedMentorIds.includes(id)
        ? prev.selectedMentorIds.filter((m) => m !== id)
        : [...prev.selectedMentorIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      if (isEditMode && initialBatch) {
        await updateBatch.mutateAsync({
          batchId: initialBatch.id,
          courseId: collectionId,
          name: form.batchName,
          description: form.aboutBatch || undefined,
          startDate: form.startDate,
          endDate: form.endDate,
          mentors: form.selectedMentorIds.length > 0 ? form.selectedMentorIds : undefined,
          enrollmentEndDate: form.enrolmentEndDate || undefined,
          issueCertificate: form.issueCertificate,
        });
      } else {
        await createBatch.mutateAsync({
          courseId: collectionId,
          name: form.batchName,
          description: form.aboutBatch || undefined,
          startDate: form.startDate,
          endDate: form.endDate,
          mentors: form.selectedMentorIds.length > 0 ? form.selectedMentorIds : undefined,
          tandc: form.acceptTerms,
          enrollmentEndDate: form.enrolmentEndDate || undefined,
          issueCertificate: form.issueCertificate,
        });
      }
      onOpenChange(false);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : isEditMode
          ? "Failed to update batch. Please try again."
          : "Failed to create batch. Please try again."
      );
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setMentorQuery("");
    setSubmitError(null);
  };

  const isSubmitDisabled =
    !form.batchName.trim() ||
    !form.startDate ||
    (!isEditMode && !form.acceptTerms) ||
    isPending;

  return (
    <>
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content 
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] max-h-[90vh] overflow-y-auto focus:outline-none"
        >

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-white rounded-t-2xl z-10">
            <Dialog.Title className="text-lg font-semibold text-sunbird-obsidian font-['Rubik']">
              {isEditMode ? "Edit Batch" : "Create Batch"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

            {/* 1-5. Batch form fields */}
            <BatchFormFields
              form={form}
              handleField={handleField}
              setForm={setForm}
              labelClass={labelClass}
              inputClass={inputClass}
            />

            {/* 6. Issue Certificate + Batch Type */}
            <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
              <div className="px-4 py-3">
                <SwitchRow
                  id="issueCertificate"
                  label="Issue Certificate"
                  checked={form.issueCertificate}
                  onChange={(v) => handleField("issueCertificate", v)}
                />
              </div>
              <div className="px-4 py-3 flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-foreground font-['Rubik']">Batch Type</span>
                <span className="text-sm font-medium text-sunbird-brick font-['Rubik']">Open</span>
              </div>
            </div>

            {/* 7. Mentors */}
            <MentorSection
              mentorsLoading={mentorsLoading}
              allMentors={allMentors}
              mentorQuery={mentorQuery}
              setMentorQuery={setMentorQuery}
              selectedMentorIds={form.selectedMentorIds}
              toggleMentor={toggleMentor}
              labelClass={labelClass}
              inputClass={inputClass}
            />

            {/* 8. Terms & Conditions (create mode only) */}
            {!isEditMode && (
              <div className="rounded-lg bg-gray-50 border border-border p-4">
                <TncCheckboxRow
                  checked={form.acceptTerms}
                  onCheckedChange={(v) => handleField("acceptTerms", !!v)}
                  onTermsClick={termsUrl ? () => setTncDialogOpen(true) : undefined}
                />
              </div>
            )}

            {/* Error message */}
            {submitError && (
              <p role="alert" className="text-xs text-red-600 font-['Rubik'] -mt-1">
                {submitError}
              </p>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="rounded-lg px-5 py-2 text-sm font-medium text-foreground bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors font-['Rubik']"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors font-['Rubik']",
                  isSubmitDisabled
                    ? "bg-sunbird-brick/40 cursor-not-allowed"
                    : "bg-sunbird-brick hover:bg-opacity-90"
                )}
              >
                {isPending && <FiLoader className="w-4 h-4 animate-spin" />}
                {isPending
                  ? isEditMode
                    ? "Saving…"
                    : "Creating…"
                  : isEditMode
                  ? "Save Changes"
                  : "Create Batch"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    {/* T&C view-only popup — rendered outside the batch modal to avoid nested dialog issues */}
    {termsUrl && (
      <TermsAndConditionsDialog
        termsUrl={termsUrl}
        title="Terms &amp; Conditions"
        open={tncDialogOpen}
        onOpenChange={setTncDialogOpen}
      >
        <span className="sr-only" />
      </TermsAndConditionsDialog>
    )}
    </>
  );
};



export default CreateBatchModal;
