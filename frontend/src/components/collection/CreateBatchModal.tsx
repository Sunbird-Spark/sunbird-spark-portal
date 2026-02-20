import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Checkbox from "@radix-ui/react-checkbox";
import { FiX, FiCheck, FiSearch, FiLoader } from "react-icons/fi";
import { useCreateBatch, useUpdateBatch } from "@/hooks/useBatch";
import { useMentorList, MentorUser } from "@/hooks/useMentor";
import { Batch } from "@/services/BatchService";
import { cn } from "@/lib/utils";

/* ─── Switch primitives ─── */

const SwitchToggle = ({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={cn(
      "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sunbird-brick/30 focus:ring-offset-2",
      checked ? "bg-sunbird-brick" : "bg-gray-300"
    )}
  >
    <span
      className={cn(
        "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200",
        checked ? "translate-x-6" : "translate-x-1"
      )}
    />
  </button>
);

interface SwitchRowProps {
  id: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  valueLabel?: string;
}

const SwitchRow = ({ id, checked, onChange, label, valueLabel }: SwitchRowProps) => (
  <div className="flex items-center justify-between gap-4">
    <label htmlFor={id} className="text-sm font-medium text-foreground font-['Rubik'] cursor-pointer">
      {label}
    </label>
    <div className="flex items-center gap-2">
      {valueLabel && (
        <span
          className={cn(
            "text-xs font-medium font-['Rubik'] transition-colors",
            checked ? "text-sunbird-brick" : "text-muted-foreground"
          )}
        >
          {valueLabel}
        </span>
      )}
      <SwitchToggle id={id} checked={checked} onChange={onChange} />
    </div>
  </div>
);

/* ─── Types ─── */

interface CreateBatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  /** When provided, the modal operates in Edit mode */
  initialBatch?: Batch;
}

interface BatchFormState {
  batchName: string;
  aboutBatch: string;
  startDate: string;
  endDate: string;
  enrolmentEndDate: string;
  issueCertificate: boolean;
  enableDiscussion: boolean;
  batchType: string;
  selectedMentorIds: string[];
  acceptTerms: boolean;
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

  // Filter mentors by query text (client-side filter since the list is usually small)
  const filteredMentors: MentorUser[] =
    mentorQuery.trim().length >= 1
      ? allMentors.filter((u) => {
          const name = [u.firstName, u.lastName].filter(Boolean).join(" ").toLowerCase();
          const email = (u.maskedEmail ?? u.email ?? "").toLowerCase();
          const q = mentorQuery.toLowerCase();
          return name.includes(q) || email.includes(q) || u.identifier.toLowerCase().includes(q);
        })
      : allMentors;

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
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] max-h-[90vh] overflow-y-auto focus:outline-none">

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

            {/* 1. Name of Batch */}
            <div>
              <label htmlFor="batchName" className={labelClass}>
                Name of Batch <span className="text-red-500">*</span>
              </label>
              <input
                id="batchName"
                type="text"
                className={inputClass}
                placeholder="Enter batch name"
                value={form.batchName}
                onChange={(e) => handleField("batchName", e.target.value)}
                required
              />
            </div>

            {/* 2. About Batch */}
            <div>
              <label htmlFor="aboutBatch" className={labelClass}>
                About Batch
              </label>
              <textarea
                id="aboutBatch"
                rows={3}
                className={cn(inputClass, "resize-none")}
                placeholder="Brief description about this batch"
                value={form.aboutBatch}
                onChange={(e) => handleField("aboutBatch", e.target.value)}
              />
            </div>

            {/* 3-5. Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Start Date (required) */}
              <div>
                <label htmlFor="startDate" className={labelClass}>
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="startDate"
                  type="date"
                  className={inputClass}
                  value={form.startDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    const updates: Partial<BatchFormState> = { startDate: newStart };
                    if (form.enrolmentEndDate && newStart > form.enrolmentEndDate)
                      updates.enrolmentEndDate = "";
                    if (form.endDate && newStart > form.endDate)
                      updates.endDate = "";
                    setForm((prev) => ({ ...prev, ...updates }));
                  }}
                  required
                />
              </div>

              {/* End Date — optional; must be >= startDate AND >= enrolmentEndDate */}
              <div>
                <label htmlFor="endDate" className={labelClass}>
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  className={inputClass}
                  value={form.endDate}
                  min={
                    form.enrolmentEndDate && form.enrolmentEndDate > (form.startDate || "")
                      ? form.enrolmentEndDate
                      : form.startDate || undefined
                  }
                  onChange={(e) => handleField("endDate", e.target.value)}
                />
                {form.enrolmentEndDate && !form.endDate && (
                  <p className="mt-0.5 text-xs text-amber-600 font-['Rubik']">
                    Must be on or after enrolment end date
                  </p>
                )}
              </div>

              {/* Enrolment End Date — optional; bounded between startDate and endDate */}
              <div>
                <label htmlFor="enrolmentEndDate" className={labelClass}>
                  Enrolment End Date
                </label>
                <input
                  id="enrolmentEndDate"
                  type="date"
                  className={inputClass}
                  value={form.enrolmentEndDate}
                  min={form.startDate || undefined}
                  max={form.endDate || undefined}
                  onChange={(e) => handleField("enrolmentEndDate", e.target.value)}
                />
                {form.startDate && (
                  <p className="mt-0.5 text-xs text-muted-foreground font-['Rubik']">
                    Between start{form.endDate ? " & end date" : " date"}
                  </p>
                )}
              </div>
            </div>

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
            <div>
              <label className={labelClass}>Mentors in the Batch</label>

              {/* Search box */}
              <div className="relative mb-2">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  className={cn(inputClass, "pl-9")}
                  placeholder="Search mentors by name or email…"
                  value={mentorQuery}
                  onChange={(e) => setMentorQuery(e.target.value)}
                />
                {mentorsLoading && (
                  <FiLoader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                )}
              </div>

              {/* Mentor list */}
              {filteredMentors.length > 0 && (
                <div className="rounded-lg border border-border bg-white shadow-sm max-h-40 overflow-y-auto divide-y divide-border">
                  {filteredMentors.map((user) => {
                    const isSelected = form.selectedMentorIds.includes(user.identifier);
                    const displayName =
                      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                      user.maskedEmail ||
                      user.email ||
                      user.identifier;
                    return (
                      <label
                        key={user.identifier}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors",
                          isSelected && "bg-sunbird-brick/5"
                        )}
                      >
                        <Checkbox.Root
                          checked={isSelected}
                          onCheckedChange={() => toggleMentor(user.identifier)}
                          className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-sunbird-brick data-[state=checked]:bg-sunbird-brick data-[state=checked]:text-white focus:outline-none"
                        >
                          <Checkbox.Indicator>
                            <FiCheck className="w-3 h-3" />
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                        <span className="text-sm text-foreground font-['Rubik']">{displayName}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {!mentorsLoading && allMentors.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">No mentors found in your organisation.</p>
              )}

              {/* Selected mentor tags */}
              {form.selectedMentorIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.selectedMentorIds.map((id) => {
                    const user = allMentors.find((u) => u.identifier === id);
                    const name = user
                      ? [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                        user.maskedEmail ||
                        user.email ||
                        id
                      : id;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 text-xs bg-sunbird-brick/10 text-sunbird-brick rounded-full px-2.5 py-0.5 font-['Rubik']"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => toggleMentor(id)}
                          className="hover:opacity-70"
                          aria-label={`Remove ${name}`}
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 8. Terms & Conditions (create mode only) */}
            {!isEditMode && (
              <div className="rounded-lg bg-gray-50 border border-border p-4">
                <CheckboxRow
                  id="acceptTerms"
                  checked={form.acceptTerms}
                  onCheckedChange={(v) => handleField("acceptTerms", !!v)}
                  label="I accept the Terms & Conditions for creating this batch."
                  required
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
  );
};

/* ─── Checkbox (used only for T&C) ─── */

interface CheckboxRowProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean | "indeterminate") => void;
  label: string;
  required?: boolean;
}

const CheckboxRow = ({ id, checked, onCheckedChange, label, required }: CheckboxRowProps) => (
  <label htmlFor={id} className="flex items-center gap-3 cursor-pointer select-none">
    <Checkbox.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      required={required}
      className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-sunbird-brick data-[state=checked]:bg-sunbird-brick data-[state=checked]:text-white focus:outline-none focus:ring-2 focus:ring-sunbird-brick/40"
    >
      <Checkbox.Indicator>
        <FiCheck className="w-3 h-3" />
      </Checkbox.Indicator>
    </Checkbox.Root>
    <span className="text-sm text-foreground font-['Rubik']">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
  </label>
);

export default CreateBatchModal;
