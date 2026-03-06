import { FiLoader } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { NewTemplateForm, ModalView } from "./types";
import { ImagePickerDialog } from "./ImagePickerDialog";

const labelClass = "block text-sm font-medium text-sunbird-obsidian mb-1 font-['Rubik']";
const inputClass = "w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sunbird-brick/40 focus:border-sunbird-brick bg-white font-['Rubik']";

interface CreateTemplatePanelProps {
  newTmpl: NewTemplateForm;
  handleNewTmplField: <K extends keyof NewTemplateForm>(key: K, value: NewTemplateForm[K]) => void;
  errorMsg: string;
  setView: (view: ModalView) => void;
  setErrorMsg: (msg: string) => void;
  isNewTmplValid: boolean;
  createLoading: boolean;
  handleSaveNewTemplate: () => Promise<void>;
}

export function CreateTemplatePanel({
  newTmpl,
  handleNewTmplField,
  errorMsg,
  setView,
  setErrorMsg,
  isNewTmplValid,
  createLoading,
  handleSaveNewTemplate,
}: CreateTemplatePanelProps) {
  return (
    <>
      <div className="overflow-y-auto px-6 py-5 space-y-5" style={{ maxHeight: "calc(90vh - 130px)" }}>
        <p className="text-xs text-muted-foreground font-['Rubik'] -mt-1">
          Fill in the details below to create a new certificate template for your organisation.
        </p>

        {/* Certificate Title */}
        <div>
          <label htmlFor="certTitle" className={labelClass}>
            Certificate Title <span className="text-red-500">*</span>
          </label>
          <input
            id="certTitle"
            type="text"
            className={inputClass}
            placeholder="e.g. Certificate of Completion"
            value={newTmpl.certTitle}
            onChange={(e) => handleNewTmplField("certTitle", e.target.value)}
          />
        </div>

        {/* Brand Name */}
        <div>
          <label htmlFor="tmplName" className={labelClass}>
            Brand Name <span className="text-red-500">*</span>
          </label>
          <input
            id="tmplName"
            type="text"
            className={inputClass}
            placeholder="e.g. Signatory full name"
            value={newTmpl.name}
            onChange={(e) => handleNewTmplField("name", e.target.value)}
          />
        </div>

        {/* Brand Logos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ImagePickerDialog
            label="Brand Logo 1"
            required
            value={newTmpl.logo1}
            onChange={(v) => handleNewTmplField("logo1", v)}
          />
          <ImagePickerDialog
            label="Brand Logo 2"
            value={newTmpl.logo2}
            onChange={(v) => handleNewTmplField("logo2", v)}
          />
        </div>

        {/* Signatures */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ImagePickerDialog
              label="Signature 1"
              required
              value={newTmpl.sig1}
              onChange={(v) => handleNewTmplField("sig1", v)}
            />
            <div>
              <label htmlFor="sig1Des" className={labelClass}>
                Signatory 1 Designation <span className="text-red-500">*</span>
              </label>
              <input
                id="sig1Des"
                type="text"
                className={inputClass}
                placeholder="e.g. Director"
                value={newTmpl.sig1Designation}
                onChange={(e) => handleNewTmplField("sig1Designation", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ImagePickerDialog
              label="Signature 2"
              value={newTmpl.sig2}
              onChange={(v) => handleNewTmplField("sig2", v)}
            />
            <div>
              <label htmlFor="sig2Des" className={labelClass}>
                Signatory 2 Designation
              </label>
              <input
                id="sig2Des"
                type="text"
                className={inputClass}
                placeholder="e.g. CEO"
                value={newTmpl.sig2Designation}
                onChange={(e) => handleNewTmplField("sig2Designation", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={newTmpl.termsAccepted}
              onChange={(e) => handleNewTmplField("termsAccepted", e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-amber-400 accent-sunbird-brick cursor-pointer"
            />
            <span className="text-xs text-amber-800 font-['Rubik'] leading-relaxed">
              I confirm that all the elements for this certificate provided by me are correct and
              appropriate and I am authorised by the signatories and logo owners to provide the same.
            </span>
          </label>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-600 font-['Rubik']">{errorMsg}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-white">
        <button
          type="button"
          onClick={() => { setView("main"); setErrorMsg(""); }}
          className="rounded-lg px-5 py-2 text-sm font-medium text-foreground bg-gray-100 hover:bg-gray-200 transition-colors font-['Rubik']"
          data-edataid="create-template-back"
          data-pageid="course-consumption"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!isNewTmplValid || createLoading}
          onClick={handleSaveNewTemplate}
          data-edataid="create-template-save"
          data-edatatype="SUBMIT"
          data-pageid="course-consumption"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors font-['Rubik']",
            !isNewTmplValid || createLoading
              ? "bg-sunbird-brick/40 cursor-not-allowed"
              : "bg-sunbird-brick hover:bg-opacity-90"
          )}
        >
          {createLoading && <FiLoader className="w-4 h-4 animate-spin" />}
          Save Template
        </button>
      </div>
    </>
  );
}
