import { FiX, FiLoader, FiAlertCircle, FiRefreshCw, FiAward } from "react-icons/fi";
import { Step, ModalView } from "./types";

interface ModalStatusOverlayProps {
  step: Step;
  stepLabel: string;
  view: ModalView;
  errorMsg: string;
  handleRefreshTemplates: () => Promise<void>;
  setStep: (step: Step) => void;
  setView: (view: ModalView) => void;
  handleClose: () => void;
}

export function ModalStatusOverlay({
  step,
  stepLabel,
  errorMsg,
  handleRefreshTemplates,
  setStep,
  setView,
  handleClose,
}: ModalStatusOverlayProps) {
  if (step === "idle") return null;

  return (
    <>
      {/* Submitting */}
      {step === "submitting" && (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <FiLoader className="w-8 h-8 text-sunbird-brick animate-spin" />
          <p className="text-sm text-muted-foreground font-['Rubik']">{stepLabel}</p>
        </div>
      )}

      {/* templateCreated success notice */}
      {step === "templateCreated" && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-8">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
            <FiAlertCircle className="w-7 h-7 text-amber-600" />
          </div>
          <p className="text-base font-semibold text-sunbird-obsidian font-['Rubik'] text-center">
            Template Created Successfully!
          </p>
          <p className="text-sm text-muted-foreground font-['Rubik'] text-center max-w-sm leading-relaxed">
            You have created the template successfully. The preview of the new template will be
            displayed in about 30 minutes. Click{" "}
            <span className="font-semibold text-sunbird-brick">Refresh</span> in case the
            template is not displayed.
          </p>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={async () => {
                await handleRefreshTemplates();
                setStep("idle");
                setView("main");
              }}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white bg-sunbird-brick hover:bg-opacity-90 transition-colors font-['Rubik']"
              data-edataid="cert-status-continue"
              data-pageid="course-consumption"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => { setStep("idle"); setView("main"); }}
              className="rounded-lg px-5 py-2 text-sm font-medium text-foreground bg-gray-100 hover:bg-gray-200 transition-colors font-['Rubik']"
              data-edataid="cert-status-back"
              data-pageid="course-consumption"
            >
              Proceed Anyway
            </button>
          </div>
        </div>
      )}

      {/* Done */}
      {step === "done" && (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <FiAward className="w-7 h-7 text-green-600" />
          </div>
          <p className="text-base font-semibold text-sunbird-obsidian font-['Rubik']">
            Certificate Added!
          </p>
          <p className="text-sm text-muted-foreground font-['Rubik'] text-center max-w-xs">
            The certificate template has been successfully attached to this batch.
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="mt-2 rounded-lg px-6 py-2 text-sm font-medium text-white bg-sunbird-brick hover:bg-opacity-90 transition-colors font-['Rubik']"
            data-edataid="cert-status-close"
            data-pageid="course-consumption"
          >
            Done
          </button>
        </div>
      )}

      {/* Error */}
      {step === "error" && (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <FiX className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-base font-semibold text-sunbird-obsidian font-['Rubik']">
            Something went wrong
          </p>
          <p className="text-sm text-red-600 font-['Rubik'] text-center max-w-xs">{errorMsg}</p>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-5 py-2 text-sm font-medium text-foreground bg-gray-100 hover:bg-gray-200 transition-colors font-['Rubik']"
              data-edataid="cert-status-cancel"
              data-pageid="course-consumption"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setStep("idle")}
              className="rounded-lg px-5 py-2 text-sm font-medium text-white bg-sunbird-brick hover:bg-opacity-90 transition-colors font-['Rubik']"
              data-edataid="cert-status-retry"
              data-pageid="course-consumption"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </>
  );
}
