import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FiX, FiLoader, FiAward } from "react-icons/fi";
import { certificateService } from "@/services/CertificateService";
import { userService } from "@/services/UserService";
import userAuthInfoService from "@/services/userAuthInfoService/userAuthInfoService";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

/* ─── Types ─── */

interface AddCertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  batchId: string;
  courseName?: string;
}

interface CertFormState {
  templateName: string;
  issuerName: string;
  issuerUrl: string;
  signatoryName: string;
  signatoryDesignation: string;
}

const INITIAL_FORM: CertFormState = {
  templateName: "Certificate of Completion",
  issuerName: "",
  issuerUrl: "",
  signatoryName: "",
  signatoryDesignation: "",
};

const labelClass = "block text-sm font-medium text-sunbird-obsidian mb-1 font-['Rubik']";
const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sunbird-brick/40 focus:border-sunbird-brick bg-white font-['Rubik']";

/* ─── SVG Certificate Generator ─── */

function generateCertificateSvg(params: {
  courseName: string;
  issuerName: string;
  signatoryName: string;
  signatoryDesignation: string;
}): string {
  const { courseName, issuerName, signatoryName, signatoryDesignation } = params;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560">
  <!-- Background -->
  <rect width="800" height="560" fill="#FFFFFF"/>
  <!-- Border outer -->
  <rect x="10" y="10" width="780" height="540" rx="8" ry="8" fill="none" stroke="#C84B31" stroke-width="4"/>
  <!-- Border inner -->
  <rect x="20" y="20" width="760" height="520" rx="6" ry="6" fill="none" stroke="#C84B31" stroke-width="1.5" stroke-dasharray="8,4"/>

  <!-- Header bar -->
  <rect x="10" y="10" width="780" height="80" rx="8" ry="8" fill="#C84B31"/>
  <rect x="10" y="70" width="780" height="20" fill="#C84B31"/>

  <!-- Header text -->
  <text x="400" y="58" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#FFFFFF" letter-spacing="4">CERTIFICATE</text>

  <!-- Sub header -->
  <text x="400" y="125" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#888888" letter-spacing="2">OF COMPLETION</text>

  <!-- Decorative line -->
  <line x1="200" y1="140" x2="600" y2="140" stroke="#C84B31" stroke-width="1"/>

  <!-- This certifies -->
  <text x="400" y="185" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#555555">This is to certify that</text>

  <!-- Recipient placeholder -->
  <text x="400" y="240" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#222222">{{recipientName}}</text>
  <line x1="180" y1="252" x2="620" y2="252" stroke="#CCCCCC" stroke-width="1"/>

  <!-- Course -->
  <text x="400" y="290" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#555555">has successfully completed the course</text>
  <text x="400" y="320" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="#C84B31">${escapeXml(courseName)}</text>

  <!-- Date placeholder -->
  <text x="400" y="365" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#888888">Date of Completion: {{completionDate}}</text>

  <!-- Decorative line -->
  <line x1="200" y1="385" x2="600" y2="385" stroke="#C84B31" stroke-width="1"/>

  <!-- Signatory section -->
  <line x1="260" y1="460" x2="440" y2="460" stroke="#555555" stroke-width="1"/>
  <text x="350" y="477" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#333333">${escapeXml(signatoryName)}</text>
  <text x="350" y="494" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#888888">${escapeXml(signatoryDesignation)}</text>

  <!-- Issuer -->
  <text x="400" y="530" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#AAAAAA">Issued by ${escapeXml(issuerName)}</text>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/* ─── Modal ─── */

type Step = "form" | "submitting" | "done" | "error";

const AddCertificateModal = ({
  open,
  onOpenChange,
  courseId,
  batchId,
  courseName = "Course",
}: AddCertificateModalProps) => {
  const [form, setForm] = useState<CertFormState>(INITIAL_FORM);
  const [step, setStep] = useState<Step>("form");
  const [stepLabel, setStepLabel] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const queryClient = useQueryClient();

  const handleField = <K extends keyof CertFormState>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setForm(INITIAL_FORM);
      setStep("form");
      setStepLabel("");
      setErrorMsg("");
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("submitting");
    setErrorMsg("");

    try {
      // Resolve user + org
      setStepLabel("Resolving user credentials…");
      let userId = userAuthInfoService.getUserId();
      if (!userId) {
        const authInfo = await userAuthInfoService.getAuthInfo();
        userId = authInfo?.uid ?? null;
      }
      if (!userId) throw new Error("User not authenticated");

      const userResponse = await userService.userRead(userId);
      const rootOrgId = (userResponse.data.response as Record<string, unknown>).rootOrgId as
        | string
        | undefined;
      if (!rootOrgId) throw new Error("Could not determine organisation");

      const reqHeaders: Record<string, string> = {
        "X-User-ID": userId,
        "X-Channel-Id": rootOrgId,
        "X-Org-code": rootOrgId,
      };

      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}_${String(now.getMinutes()).padStart(2, "0")}`;
      const fileName = `certificate_${timestamp}.svg`;
      const assetCode = form.templateName.trim() || "Certificate";

      // Step 1: Create asset
      setStepLabel("Creating certificate template asset…");
      const createResp = await certificateService.createAsset(
        {
          name: assetCode,
          code: assetCode,
          mimeType: "image/svg+xml",
          license: "CC BY 4.0",
          primaryCategory: "Certificate Template",
          mediaType: "image",
          certType: "cert template",
          channel: rootOrgId,
          issuer: {
            name: form.issuerName.trim() || "Organisation",
            url: form.issuerUrl.trim() || window.location.origin,
          },
          signatoryList: [
            {
              name: form.signatoryName.trim() || "Director",
              designation: form.signatoryDesignation.trim() || "",
              id: `${form.signatoryDesignation.trim() || "signatory"}/${form.signatoryDesignation.trim() || "signatory"}`,
            },
          ],
        },
        reqHeaders
      );

      const assetId = createResp.data?.identifier;
      if (!assetId) throw new Error("Failed to create certificate asset");

      // Step 2: Generate and upload SVG
      setStepLabel("Uploading certificate design…");
      const svgContent = generateCertificateSvg({
        courseName,
        issuerName: form.issuerName.trim() || "Organisation",
        signatoryName: form.signatoryName.trim() || "Director",
        signatoryDesignation: form.signatoryDesignation.trim() || "",
      });
      const svgBlob = new Blob([svgContent], { type: "image/svg+xml" });
      const uploadResp = await certificateService.uploadAsset(assetId, svgBlob, fileName, reqHeaders);

      const previewUrl =
        (uploadResp.data as any)?.artifactUrl ||
        (uploadResp.data as any)?.content_url ||
        "";

      // Step 3: Attach template to batch
      setStepLabel("Attaching certificate to batch…");
      await certificateService.addTemplateToBatch(
        {
          batch: {
            courseId,
            batchId,
            template: {
              identifier: assetId,
              criteria: {
                enrollment: { status: 2 },
              },
              name: assetCode,
              issuer: {
                name: form.issuerName.trim() || "Organisation",
                url: form.issuerUrl.trim() || window.location.origin,
              },
              previewUrl,
              signatoryList: [
                {
                  name: form.signatoryName.trim() || "Director",
                  designation: form.signatoryDesignation.trim() || "",
                  id: `${form.signatoryDesignation.trim() || "signatory"}/${form.signatoryDesignation.trim() || "signatory"}`,
                },
              ],
            },
          },
        },
        reqHeaders
      );

      // Refresh batch list so certTemplates is updated
      queryClient.invalidateQueries({ queryKey: ["batchList", courseId] });

      setStep("done");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
      setStep("error");
    }
  };

  const isFormValid =
    form.templateName.trim() &&
    form.issuerName.trim() &&
    form.signatoryName.trim();

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] max-h-[90vh] overflow-y-auto focus:outline-none">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-white rounded-t-2xl z-10">
            <div className="flex items-center gap-2">
              <FiAward className="w-5 h-5 text-sunbird-brick" />
              <Dialog.Title className="text-lg font-semibold text-sunbird-obsidian font-['Rubik']">
                Add Certificate
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="px-6 py-5">

            {/* ── Submitting ── */}
            {step === "submitting" && (
              <div className="flex flex-col items-center justify-center gap-4 py-10">
                <FiLoader className="w-8 h-8 text-sunbird-brick animate-spin" />
                <p className="text-sm text-muted-foreground font-['Rubik'] text-center">{stepLabel}</p>
              </div>
            )}

            {/* ── Done ── */}
            {step === "done" && (
              <div className="flex flex-col items-center justify-center gap-4 py-10">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <FiAward className="w-7 h-7 text-green-600" />
                </div>
                <p className="text-base font-semibold text-sunbird-obsidian font-['Rubik']">
                  Certificate Added!
                </p>
                <p className="text-sm text-muted-foreground font-['Rubik'] text-center">
                  The certificate template has been successfully attached to this batch.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-2 rounded-lg px-6 py-2 text-sm font-medium text-white bg-sunbird-brick hover:bg-opacity-90 transition-colors font-['Rubik']"
                >
                  Done
                </button>
              </div>
            )}

            {/* ── Error ── */}
            {step === "error" && (
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                  <FiX className="w-7 h-7 text-red-500" />
                </div>
                <p className="text-base font-semibold text-sunbird-obsidian font-['Rubik']">
                  Something went wrong
                </p>
                <p className="text-sm text-red-600 font-['Rubik'] text-center">{errorMsg}</p>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg px-5 py-2 text-sm font-medium text-foreground bg-gray-100 hover:bg-gray-200 transition-colors font-['Rubik']"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="rounded-lg px-5 py-2 text-sm font-medium text-white bg-sunbird-brick hover:bg-opacity-90 transition-colors font-['Rubik']"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* ── Form ── */}
            {step === "form" && (
              <form onSubmit={handleSubmit} className="space-y-5">

                <p className="text-xs text-muted-foreground font-['Rubik'] -mt-1">
                  Configure a certificate that will be issued to learners who complete this batch.
                </p>

                {/* Template Name */}
                <div>
                  <label htmlFor="templateName" className={labelClass}>
                    Certificate Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="templateName"
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Certificate of Completion"
                    value={form.templateName}
                    onChange={(e) => handleField("templateName", e.target.value)}
                    required
                  />
                </div>

                {/* Issuer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="issuerName" className={labelClass}>
                      Issuer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="issuerName"
                      type="text"
                      className={inputClass}
                      placeholder="e.g. Ministry of Education"
                      value={form.issuerName}
                      onChange={(e) => handleField("issuerName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="issuerUrl" className={labelClass}>
                      Issuer Website
                    </label>
                    <input
                      id="issuerUrl"
                      type="url"
                      className={inputClass}
                      placeholder="https://…"
                      value={form.issuerUrl}
                      onChange={(e) => handleField("issuerUrl", e.target.value)}
                    />
                  </div>
                </div>

                {/* Signatory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="signatoryName" className={labelClass}>
                      Signatory Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="signatoryName"
                      type="text"
                      className={inputClass}
                      placeholder="e.g. Jane Smith"
                      value={form.signatoryName}
                      onChange={(e) => handleField("signatoryName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="signatoryDesignation" className={labelClass}>
                      Designation
                    </label>
                    <input
                      id="signatoryDesignation"
                      type="text"
                      className={inputClass}
                      placeholder="e.g. Director"
                      value={form.signatoryDesignation}
                      onChange={(e) => handleField("signatoryDesignation", e.target.value)}
                    />
                  </div>
                </div>

                {/* Info banner */}
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                  <p className="text-xs text-amber-800 font-['Rubik']">
                    A certificate template will be auto-generated and attached to this batch. Learners
                    who complete the course will receive this certificate.
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg px-5 py-2 text-sm font-medium text-foreground bg-gray-100 hover:bg-gray-200 transition-colors font-['Rubik']"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors font-['Rubik']",
                      !isFormValid
                        ? "bg-sunbird-brick/40 cursor-not-allowed"
                        : "bg-sunbird-brick hover:bg-opacity-90"
                    )}
                  >
                    <FiAward className="w-4 h-4" />
                    Add Certificate
                  </button>
                </div>
              </form>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AddCertificateModal;
