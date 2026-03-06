import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiAward } from "react-icons/fi";
import { cn } from "@/lib/utils";
import { AddCertificateModalProps } from "./certificate/types";
import { useCertificateModalState } from "./certificate/useCertificateModalState";
import { CurrentCertificatePanel } from "./certificate/CurrentCertificatePanel";
import { CertificateRulesPanel } from "./certificate/CertificateRulesPanel";
import { CertificateTemplatesPanel } from "./certificate/CertificateTemplatesPanel";
import { CreateTemplatePanel } from "./certificate/CreateTemplatePanel";
import { TemplatePreviewModal } from "./certificate/TemplatePreviewModal";
import { ModalStatusOverlay } from "./certificate/ModalStatusOverlay";

const AddCertificateModal = ({
  open,
  onOpenChange,
  courseId,
  batchId,
  courseName: _courseName = "Course",
  existingCertTemplates = {},
}: AddCertificateModalProps) => {
  const state = useCertificateModalState(courseId, batchId, existingCertTemplates, onOpenChange);

  return (
    <>
      {/* Main modal */}
      <Dialog.Root open={open} onOpenChange={state.handleClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 flex flex-col -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none overflow-hidden"
            style={{ width: "min(92vw, 56rem)", maxHeight: "90vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <FiAward className="w-5 h-5 text-sunbird-brick" />
                <Dialog.Title className="text-lg font-semibold text-sunbird-obsidian font-['Rubik']">
                  {state.view === "createTemplate" ? "Create Certificate Template" : "Certificate"}
                </Dialog.Title>
              </div>
              {state.view === "createTemplate" ? (
                <button
                  type="button"
                  onClick={() => { state.setView("main"); state.setErrorMsg(""); }}
                  className="text-sm text-sunbird-brick hover:underline font-['Rubik']"
                  data-edataid="cert-modal-back"
                  data-pageid="course-consumption"
                >
                  ← Back
                </button>
              ) : (
                <Dialog.Close asChild>
                  <button
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                    data-edataid="cert-modal-close"
                    data-pageid="course-consumption"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              )}
            </div>

            <ModalStatusOverlay
              step={state.step}
              stepLabel={state.stepLabel}
              view={state.view}
              errorMsg={state.errorMsg}
              handleRefreshTemplates={state.handleRefreshTemplates}
              setStep={state.setStep}
              setView={state.setView}
              handleClose={state.handleClose}
            />

            {/* Main view — two-panel */}
            {state.step === "idle" && state.view === "main" && (
              <>
                <div className="flex-1 overflow-y-auto min-h-0">
                  {/* ── Current / Change tab bar (only when editing) ── */}
                  {state.hasExistingCert && (
                    <div className="flex border-b border-border bg-white sticky top-0 z-0">
                      {(["current", "change"] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => state.setCertTab(tab)}
                          data-edataid={`cert-tab-${tab}`}
                          data-pageid="course-consumption"
                          className={cn(
                            "flex-1 py-2.5 text-sm font-['Rubik'] font-medium relative transition-colors",
                            state.certTab === tab
                              ? "text-sunbird-brick"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {tab === "current" ? "Current Certificate" : "Change Certificate"}
                          {state.certTab === tab && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sunbird-brick rounded-t-full" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ── Current Certificate panel ── */}
                  {state.hasExistingCert && state.certTab === "current" && (
                    <CurrentCertificatePanel 
                      existingCertTemplates={existingCertTemplates} 
                      setCertTab={state.setCertTab} 
                    />
                  )}

                  {/* ── Change Certificate panel (standard picker) ── */}
                  {(!state.hasExistingCert || state.certTab === "change") && (
                    <div className="flex h-full">
                      <CertificateRulesPanel
                        issueTo={state.issueTo}
                        setIssueTo={state.setIssueTo}
                        issueToAccepted={state.issueToAccepted}
                        setIssueToAccepted={state.setIssueToAccepted}
                        selectedTemplate={state.selectedTemplate}
                        showScoreRuleComponent={state.showScoreRuleComponent}
                        enableScoreRule={state.enableScoreRule}
                        setEnableScoreRule={state.setEnableScoreRule}
                        scoreRuleValue={state.scoreRuleValue}
                        setScoreRuleValue={state.setScoreRuleValue}
                      />
                      <CertificateTemplatesPanel
                        handleRefreshTemplates={state.handleRefreshTemplates}
                        templatesRefreshing={state.templatesRefreshing}
                        setView={state.setView}
                        setErrorMsg={state.setErrorMsg}
                        templatesLoading={state.templatesLoading}
                        certTemplates={state.certTemplates}
                        selectedTemplateId={state.selectedTemplateId}
                        setPreviewTemplate={state.setPreviewTemplate}
                      />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-white">
                  <button
                    type="button"
                    onClick={state.handleClose}
                    className="rounded-lg px-5 py-2 text-sm font-medium text-foreground bg-gray-100 hover:bg-gray-200 transition-colors font-['Rubik']"
                    data-edataid="cert-modal-cancel"
                    data-pageid="course-consumption"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!state.isAddCertEnabled}
                    onClick={state.handleAddCertificate}
                    data-edataid="cert-modal-add"
                    data-edatatype="SUBMIT"
                    data-pageid="course-consumption"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors font-['Rubik']",
                      !state.isAddCertEnabled
                        ? "bg-sunbird-brick/40 cursor-not-allowed"
                        : "bg-sunbird-brick hover:bg-opacity-90"
                    )}
                  >
                    <FiAward className="w-4 h-4" />
                    Add Certificate
                  </button>
                </div>
              </>
            )}

            {/* Create New Template form */}
            {state.step === "idle" && state.view === "createTemplate" && (
              <CreateTemplatePanel
                newTmpl={state.newTmpl}
                handleNewTmplField={state.handleNewTmplField}
                errorMsg={state.errorMsg}
                setView={state.setView}
                setErrorMsg={state.setErrorMsg}
                isNewTmplValid={state.isNewTmplValid}
                createLoading={state.createLoading}
                handleSaveNewTemplate={state.handleSaveNewTemplate}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <TemplatePreviewModal
        previewTemplate={state.previewTemplate}
        setPreviewTemplate={state.setPreviewTemplate}
        certTemplates={state.certTemplates}
        setSelectedTemplateId={state.setSelectedTemplateId}
      />
    </>
  );
};

export default AddCertificateModal;
