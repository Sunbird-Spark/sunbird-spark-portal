import React from "react";
import { cn } from "@/lib/utils";

export interface BatchFormState {
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

interface BatchFormFieldsProps {
  form: BatchFormState;
  handleField: <K extends keyof BatchFormState>(key: K, value: BatchFormState[K]) => void;
  setForm: React.Dispatch<React.SetStateAction<BatchFormState>>;
  labelClass?: string;
  inputClass?: string;
}

export function BatchFormFields({
  form,
  handleField,
  setForm,
  labelClass = "block text-sm font-medium text-sunbird-obsidian mb-1 font-['Rubik']",
  inputClass = "w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sunbird-brick/40 focus:border-sunbird-brick bg-white font-['Rubik']",
}: BatchFormFieldsProps) {
  return (
    <>
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
    </>
  );
}
