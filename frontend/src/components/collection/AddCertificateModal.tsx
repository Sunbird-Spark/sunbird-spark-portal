import { useState, useRef, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  FiX,
  FiLoader,
  FiAward,
  FiPlus,
  FiCheck,
  FiImage,
  FiUpload,
  FiChevronDown,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";
import { certificateService } from "@/services/CertificateService";
import { userService } from "@/services/UserService";
import userAuthInfoService from "@/services/userAuthInfoService/userAuthInfoService";
import { useCertTemplates, useMyImages, useAllImages } from "@/hooks/useCertificate";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

/* ─── Constants ─── */

const CERT_TEMPLATE_SVG_URL =
  "https://downloadableartifacts.blob.core.windows.net/release600/certificate_template.svg";

/* ─── Types ─── */

interface AddCertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  batchId: string;
  courseName?: string;
  /** Existing certTemplates from the batch object (key=templateId, value=template config) */
  existingCertTemplates?: Record<string, any>;
}

type IssueTo = "all" | "org";

interface ImagePickerState {
  /** base64 url for preview (or CDN URL for My/All Images picks) */
  preview: string | null;
  /** uploaded artifact URL after API call */
  artifactUrl: string | null;
  /** The actual File object (if uploaded fresh) */
  file: File | null;
}

const emptyImage = (): ImagePickerState => ({
  preview: null,
  artifactUrl: null,
  file: null,
});

interface NewTemplateForm {
  certTitle: string;
  name: string;
  logo1: ImagePickerState;
  logo2: ImagePickerState;
  sig1: ImagePickerState;
  sig1Designation: string;
  sig2: ImagePickerState;
  sig2Designation: string;
  termsAccepted: boolean;
}

const emptyNewTemplate = (): NewTemplateForm => ({
  certTitle: "",
  name: "",
  logo1: emptyImage(),
  logo2: emptyImage(),
  sig1: emptyImage(),
  sig1Designation: "",
  sig2: emptyImage(),
  sig2Designation: "",
  termsAccepted: false,
});

type ModalView = "main" | "createTemplate";
type Step = "idle" | "submitting" | "done" | "error" | "templateCreated";
type ImageTab = "myImages" | "allImages" | "upload";

/* ─── CSS helpers ─── */

const labelClass =
  "block text-sm font-medium text-sunbird-obsidian mb-1 font-['Rubik']";
const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sunbird-brick/40 focus:border-sunbird-brick bg-white font-['Rubik']";

/* ─── Resolve user/org helper ─── */

async function resolveUserAndOrg() {
  let userId = userAuthInfoService.getUserId();
  if (!userId) {
    const authInfo = await userAuthInfoService.getAuthInfo();
    userId = authInfo?.uid ?? null;
  }
  if (!userId) throw new Error("User not authenticated");

  const userResponse = await userService.userRead(userId);
  const userObj = userResponse.data.response as Record<string, unknown>;
  const rootOrgId = (userObj.rootOrgId as string | undefined) ?? "";
  const firstName = (userObj.firstName as string | undefined) ?? "";
  const lastName  = (userObj.lastName  as string | undefined) ?? "";
  const userName  = [firstName, lastName].filter(Boolean).join(" ") || userId;

  return { userId, rootOrgId, userName };
}

/* ─── Image Picker — child popup dialog ─── */

interface ImagePickerProps {
  label: string;
  required?: boolean;
  value: ImagePickerState;
  onChange: (v: ImagePickerState) => void;
}

const LICENSE_STATEMENT =
  "I understand and confirm that all resources and assets created through the content editor or uploaded on the platform shall be available for free and public use without limitations on the platform (web portal, applications and any other end-user interface that the platform would enable) as per platform policy guidelines. In doing so, I confirm that the copyright and license of the original author are not infringed.";

function ImagePickerDialog({ label, required, value, onChange }: ImagePickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ImageTab>("myImages");

  /* Upload tab state */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadCreator, setUploadCreator] = useState("");
  const [dragging, setDragging] = useState(false);

  const { data: myImages = [], isLoading: loadingMy } = useMyImages();
  const { data: allImages = [], isLoading: loadingAll } = useAllImages();

  /* ── Resolve creator name once when upload tab opens ── */
  const initUploadTab = async () => {
    if (uploadCreator) return;
    try {
      const { userName } = await resolveUserAndOrg();
      setUploadCreator(userName);
    } catch { /* ignore */ }
  };

  const handleTabChange = (t: ImageTab) => {
    setTab(t);
    if (t === "upload") initUploadTab();
  };

  /* ── File handling ── */
  const applyFile = (file: File) => {
    setUploadFile(file);
    setUploadFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) applyFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) applyFile(f);
  };

  const handleSelectImage = (url: string) => {
    onChange({ preview: url, artifactUrl: url, file: null });
    setOpen(false);
  };

  const handleUploadAndUse = () => {
    if (!uploadFile || !uploadPreview) return;
    onChange({ preview: uploadPreview, artifactUrl: null, file: uploadFile });
    setOpen(false);
    /* Reset upload tab state */
    setUploadFile(null);
    setUploadPreview(null);
    setUploadFileName("");
  };

  const handleBack = () => setTab("myImages");

  const tabBtn = (t: ImageTab, txt: string) => (
    <button
      key={t}
      type="button"
      onClick={() => handleTabChange(t)}
      className={cn(
        "flex-1 py-2.5 text-sm font-['Rubik'] font-medium relative transition-colors",
        tab === t ? "text-sunbird-brick" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {txt}
      {tab === t && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sunbird-brick rounded-t-full" />
      )}
    </button>
  );

  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {/* Trigger / preview */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full rounded-lg border border-dashed border-border py-3 flex items-center justify-center gap-2 text-sm font-['Rubik'] transition-colors hover:border-sunbird-brick hover:text-sunbird-brick",
          value.preview ? "text-sunbird-brick border-sunbird-brick/40" : "text-muted-foreground"
        )}
      >
        {value.preview ? (
          <>
            <img src={value.preview} alt="selected" className="h-8 w-8 rounded object-cover" />
            <span className="text-xs">Change image</span>
          </>
        ) : (
          <>
            <FiImage className="w-4 h-4" />
            <span>Select image</span>
          </>
        )}
      </button>
      {value.preview && (
        <button
          type="button"
          onClick={() => onChange(emptyImage())}
          className="mt-1 text-xs text-red-400 hover:text-red-600 font-['Rubik']"
        >
          Remove
        </button>
      )}

      {/* Child dialog */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-[70] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl focus:outline-none overflow-hidden flex flex-col"
            style={{ width: "min(92vw, 38rem)", maxHeight: "80vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <Dialog.Title className="text-base font-semibold text-sunbird-obsidian font-['Rubik']">
                Select Image — {label}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Tabs */}
            {tab !== "upload" && (
              <div className="flex border-b border-border shrink-0">
                {tabBtn("myImages", "My Images")}
                {tabBtn("allImages", "All Images")}
                {tabBtn("upload", "Upload Image")}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* My Images */}
              {tab === "myImages" && (
                <div className="p-4">
                  {loadingMy && (
                    <div className="flex items-center justify-center py-8">
                      <FiLoader className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!loadingMy && myImages.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FiImage className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs font-['Rubik']">
                        No images uploaded yet. Use "Upload Image" tab.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    {myImages.map((img) => (
                      <button
                        key={img.identifier}
                        type="button"
                        title={img.name}
                        onClick={() => handleSelectImage(img.url)}
                        className={cn(
                          "aspect-square rounded-lg overflow-hidden border-2 transition-colors",
                          value.artifactUrl === img.url
                            ? "border-sunbird-brick"
                            : "border-transparent hover:border-border"
                        )}
                      >
                        <img src={img.url} alt={img.name} className="object-cover w-full h-full" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Images */}
              {tab === "allImages" && (
                <div className="p-4">
                  {loadingAll && (
                    <div className="flex items-center justify-center py-8">
                      <FiLoader className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!loadingAll && allImages.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FiImage className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs font-['Rubik']">No images found in this organisation.</p>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    {allImages.map((img) => (
                      <button
                        key={img.identifier}
                        type="button"
                        title={img.name}
                        onClick={() => handleSelectImage(img.url)}
                        className={cn(
                          "aspect-square rounded-lg overflow-hidden border-2 transition-colors",
                          value.artifactUrl === img.url
                            ? "border-sunbird-brick"
                            : "border-transparent hover:border-border"
                        )}
                      >
                        <img src={img.url} alt={img.name} className="object-cover w-full h-full" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Image */}
              {tab === "upload" && (
                <div className="p-5 space-y-4">
                  {/* Drag & drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "rounded-xl border-2 border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 py-8 px-4",
                      dragging
                        ? "border-sunbird-brick bg-sunbird-brick/5"
                        : "border-border hover:border-sunbird-brick hover:bg-gray-50"
                    )}
                  >
                    {uploadPreview ? (
                      <img
                        src={uploadPreview}
                        alt="preview"
                        className="max-h-24 max-w-full object-contain rounded"
                      />
                    ) : (
                      <>
                        <FiUpload className="w-6 h-6 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground font-['Rubik'] text-center">
                          Choose or drag and drop your image here
                        </p>
                        <p className="text-xs text-muted-foreground font-['Rubik']">
                          PNG, JPG, SVG supported
                        </p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </div>

                  {/* Copyrights and License */}
                  <div>
                    <label className={labelClass}>
                      Copyrights and License <span className="text-red-500">*</span>
                    </label>
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                      <p className="text-xs text-amber-800 font-['Rubik'] leading-relaxed">
                        {LICENSE_STATEMENT}
                      </p>
                    </div>
                  </div>

                  {/* File Name */}
                  <div>
                    <label className={labelClass}>
                      File name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="File name"
                      value={uploadFileName}
                      onChange={(e) => setUploadFileName(e.target.value)}
                    />
                  </div>

                  {/* Creator */}
                  <div>
                    <label className={labelClass}>Creator</label>
                    <input
                      type="text"
                      className={cn(inputClass, "bg-gray-50 text-muted-foreground cursor-default")}
                      readOnly
                      value={uploadCreator}
                      placeholder="Loading…"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-foreground bg-gray-100 hover:bg-gray-200 transition-colors font-['Rubik']"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-4 py-2 text-sm font-medium text-foreground bg-gray-100 hover:bg-gray-200 transition-colors font-['Rubik']"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!uploadFile || !uploadFileName.trim()}
                      onClick={handleUploadAndUse}
                      className={cn(
                        "ml-auto rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors font-['Rubik'] inline-flex items-center gap-2",
                        !uploadFile || !uploadFileName.trim()
                          ? "bg-sunbird-brick/40 cursor-not-allowed"
                          : "bg-sunbird-brick hover:bg-opacity-90"
                      )}
                    >
                      <FiUpload className="w-4 h-4" />
                      Upload &amp; Use
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer (My/All Images tabs) */}
            {tab !== "upload" && (
              <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-border shrink-0">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-lg px-5 py-2 text-sm font-medium text-foreground bg-gray-100 hover:bg-gray-200 transition-colors font-['Rubik']"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={() => handleTabChange("upload")}
                  className="rounded-lg px-5 py-2 text-sm font-medium text-sunbird-brick border border-sunbird-brick hover:bg-sunbird-brick hover:text-white transition-colors font-['Rubik'] inline-flex items-center gap-2"
                >
                  <FiUpload className="w-4 h-4" />
                  Upload New
                </button>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/* ─── Template Thumbnail ─── */

interface TemplateThumbnailProps {
  name: string;
  previewUrl?: string;
  selected?: boolean;
  onClick: () => void;
}

function TemplateThumbnail({ name, previewUrl, selected, onClick }: TemplateThumbnailProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border-2 overflow-hidden transition-all text-left w-full",
        selected
          ? "border-sunbird-brick shadow-md"
          : "border-border hover:border-sunbird-brick/50"
      )}
    >
      <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative overflow-hidden">
        {previewUrl ? (
          <img src={previewUrl} alt={name} className="object-cover w-full h-full" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <FiAward className="w-6 h-6" />
            <span className="text-xs font-['Rubik']">Preview</span>
          </div>
        )}
        {selected && (
          <div className="absolute top-1 right-1 bg-sunbird-brick text-white rounded-full p-0.5">
            <FiCheck className="w-3 h-3" />
          </div>
        )}
      </div>
      <div className="px-2 py-1.5 border-t border-border bg-white">
        <p className="text-xs font-medium font-['Rubik'] text-foreground truncate">{name}</p>
      </div>
    </button>
  );
}

/* ─── Main Modal ─── */

const AddCertificateModal = ({
  open,
  onOpenChange,
  courseId,
  batchId,
  courseName = "Course",
  existingCertTemplates = {},
}: AddCertificateModalProps) => {
  const queryClient = useQueryClient();

  /* State */
  const [view, setView] = useState<ModalView>("main");
  const [issueTo, setIssueTo] = useState<IssueTo>("all");
  const [issueToAccepted, setIssueToAccepted] = useState(false);
  const [progressRule, setProgressRule] = useState("100");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [newTmpl, setNewTmpl] = useState<NewTemplateForm>(emptyNewTemplate());
  const [step, setStep] = useState<Step>("idle");
  const [stepLabel, setStepLabel] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [templatesRefreshing, setTemplatesRefreshing] = useState(false);

  /* Tab when batch already has a cert template: "current" or "change" */
  const hasExistingCert = Object.keys(existingCertTemplates).length > 0;
  const [certTab, setCertTab] = useState<"current" | "change">(hasExistingCert ? "current" : "change");

  const { data: certTemplates = [], isLoading: templatesLoading } = useCertTemplates();

  /**
   * Holds the signatoryList built during "Save Template" so it's immediately
   * available for the "Add Certificate" call even before the certTemplates
   * query re-fetches and returns the freshly-created template's data.
   */
  const lastBuiltSignatoryListRef = useRef<
    Array<{ name: string; designation: string; id: string; image: string }>
  >([]);

  const selectedTemplate = certTemplates.find((t) => t.identifier === selectedTemplateId);

  /* ── Handlers ── */

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setTimeout(() => {
      setView("main");
      setIssueTo("all");
      setIssueToAccepted(false);
      setProgressRule("100");
      setSelectedTemplateId(null);
      setPreviewTemplate(null);
      setNewTmpl(emptyNewTemplate());
      setStep("idle");
      setStepLabel("");
      setErrorMsg("");
      setTemplatesRefreshing(false);
      setCertTab(hasExistingCert ? "current" : "change");
    }, 300);
  }, [onOpenChange]);

  const handleNewTmplField = <K extends keyof NewTemplateForm>(
    key: K,
    value: NewTemplateForm[K]
  ) => {
    setNewTmpl((prev) => ({ ...prev, [key]: value }));
  };

  /* ── Create New Template ── */
  const handleSaveNewTemplate = async () => {
    setCreateLoading(true);
    setErrorMsg("");
    try {
      const { userId, rootOrgId } = await resolveUserAndOrg();
      const reqHeaders: Record<string, string> = {
        "X-User-ID": userId,
        "X-Channel-Id": rootOrgId,
        "X-Org-code": rootOrgId,
      };

      // Build signatory list.
      // Use the picker preview directly (base64 dataURL for fresh uploads, CDN URL for My/All Images).
      // We do NOT create separate image assets — the sandbox passes image inline in signatoryList.image.
      const sigList: Array<{ name: string; designation: string; id: string; image: string }> = [];
      if (newTmpl.sig1Designation || newTmpl.sig1.preview) {
        sigList.push({
          name: newTmpl.name || "Signatory 1",
          designation: newTmpl.sig1Designation || "",
          id: `${newTmpl.sig1Designation || "sig1"}/${newTmpl.sig1Designation || "sig1"}`,
          image: newTmpl.sig1.preview || "",
        });
      }
      if (newTmpl.sig2Designation || newTmpl.sig2.preview) {
        sigList.push({
          name: newTmpl.name || "Signatory 2",
          designation: newTmpl.sig2Designation || "",
          id: `${newTmpl.sig2Designation || "sig2"}/${newTmpl.sig2Designation || "sig2"}`,
          image: newTmpl.sig2.preview || "",
        });
      }

      // Create certificate template asset record
      const assetCode = newTmpl.certTitle.trim() || "Certificate";
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
          issuer: { name: rootOrgId, url: window.location.origin },
          signatoryList:
            sigList.length > 0
              ? sigList
              : [{ name: "Director", designation: "", id: "Director/Director", image: "" }],
        },
        reqHeaders
      );

      const assetId = createResp.data?.identifier;
      if (!assetId) throw new Error("Failed to create certificate asset");

      // Fetch the official SVG template from Sunbird CDN
      const svgResp = await fetch(CERT_TEMPLATE_SVG_URL);
      if (!svgResp.ok) throw new Error("Failed to fetch certificate SVG template");
      const svgText = await svgResp.text();
      const svgBlob = new Blob([svgText], { type: "image/svg+xml" });

      const now = new Date();
      const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}_${String(now.getMinutes()).padStart(2, "0")}`;
      await certificateService.uploadAsset(assetId, svgBlob, `certificate_${ts}.svg`, reqHeaders);

      // Store sigList before invalidating so handleAddCertificate has it immediately
      lastBuiltSignatoryListRef.current =
        sigList.length > 0
          ? sigList
          : [{ name: "Director", designation: "", id: "Director/Director", image: "" }];

      await queryClient.invalidateQueries({ queryKey: ["certTemplates"] });
      setSelectedTemplateId(assetId);
      setView("main");
      // Show the 30-min delay notice before going back to main
      setStep("templateCreated");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create template.");
    } finally {
      setCreateLoading(false);
    }
  };

  /* ── Add Certificate (attach to batch) ── */
  const handleAddCertificate = async () => {
    if (!selectedTemplateId || !selectedTemplate) return;
    setStep("submitting");
    setErrorMsg("");
    try {
      setStepLabel("Resolving credentials…");
      const { userId, rootOrgId } = await resolveUserAndOrg();
      const reqHeaders: Record<string, string> = {
        "X-User-ID": userId,
        "X-Channel-Id": rootOrgId,
        "X-Org-code": rootOrgId,
      };

      // Fetch the full template record — search results strip signatoryList.image
      setStepLabel("Fetching template details…");
      let fullSignatoryList: Array<{ name: string; designation: string; id: string; image: string }> | undefined;
      let fullPreviewUrl = selectedTemplate.previewUrl ?? selectedTemplate.artifactUrl ?? "";
      let fullIssuer = selectedTemplate.issuer;
      try {
        const readResp = await certificateService.readCertTemplate(selectedTemplateId);
        const content = readResp.data?.content;
        if (content) {
          if (Array.isArray(content.signatoryList) && content.signatoryList.length > 0) {
            fullSignatoryList = content.signatoryList.map((s: any) => ({
              name: s.name ?? "",
              designation: s.designation ?? "",
              id: s.id ?? `${s.name}/${s.name}`,
              image: s.image ?? "",
            }));
          }
          if (content.artifactUrl) fullPreviewUrl = content.artifactUrl;
          if (content.issuer) fullIssuer = content.issuer;
        }
      } catch {
        // Fall through — use search-cached data / ref
      }

      setStepLabel("Attaching certificate to batch…");
      const criteria: { enrollment: { status: number }; user?: { rootOrgId: string } } = {
        enrollment: { status: 2 },
      };
      if (issueTo === "org") {
        criteria.user = { rootOrgId };
      }

      const signatoryList =
        (fullSignatoryList && fullSignatoryList.length > 0 ? fullSignatoryList : null) ??
        (lastBuiltSignatoryListRef.current.length > 0
          ? lastBuiltSignatoryListRef.current
          : [{ name: "Director", designation: "", id: "Director/Director", image: "" }]);

      await certificateService.addTemplateToBatch(
        {
          batch: {
            courseId,
            batchId,
            template: {
              identifier: selectedTemplateId,
              criteria,
              name: selectedTemplate.name,
              issuer: fullIssuer ?? { name: rootOrgId, url: window.location.origin },
              previewUrl: fullPreviewUrl,
              signatoryList,
            },
          },
        },
        reqHeaders
      );

      queryClient.refetchQueries({ queryKey: ["batchList", courseId] });
      setStep("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
      setStep("error");
    }
  };


  const isNewTmplValid =
    newTmpl.certTitle.trim() &&
    newTmpl.name.trim() &&
    !!newTmpl.logo1.preview &&
    !!newTmpl.sig1.preview &&
    !!newTmpl.sig1Designation.trim() &&
    newTmpl.termsAccepted;

  const handleRefreshTemplates = async () => {
    setTemplatesRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["certTemplates"] });
    setTemplatesRefreshing(false);
  };

  const isAddCertEnabled =
    !!selectedTemplateId && issueToAccepted;
  /* ── Render ── */

  return (
    <>
      {/* Main modal */}
      <Dialog.Root open={open} onOpenChange={handleClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none overflow-hidden"
            style={{ width: "min(92vw, 56rem)", maxHeight: "90vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <FiAward className="w-5 h-5 text-sunbird-brick" />
                <Dialog.Title className="text-lg font-semibold text-sunbird-obsidian font-['Rubik']">
                  {view === "createTemplate" ? "Create Certificate Template" : "Certificate"}
                </Dialog.Title>
              </div>
              {view === "createTemplate" ? (
                <button
                  type="button"
                  onClick={() => { setView("main"); setErrorMsg(""); }}
                  className="text-sm text-sunbird-brick hover:underline font-['Rubik']"
                >
                  ← Back
                </button>
              ) : (
                <Dialog.Close asChild>
                  <button
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </Dialog.Close>
              )}
            </div>

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
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep("idle"); setView("main"); }}
                    className="rounded-lg px-5 py-2 text-sm font-medium text-foreground bg-gray-100 hover:bg-gray-200 transition-colors font-['Rubik']"
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
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("idle")}
                    className="rounded-lg px-5 py-2 text-sm font-medium text-white bg-sunbird-brick hover:bg-opacity-90 transition-colors font-['Rubik']"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Main view — two-panel */}
            {step === "idle" && view === "main" && (
              <>
                {/* ── Current / Change tab bar (only when editing) ── */}
                {hasExistingCert && (
                  <div className="flex border-b border-border bg-white sticky top-0 z-0">
                    {(["current", "change"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setCertTab(tab)}
                        className={cn(
                          "flex-1 py-2.5 text-sm font-['Rubik'] font-medium relative transition-colors",
                          certTab === tab
                            ? "text-sunbird-brick"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tab === "current" ? "Current Certificate" : "Change Certificate"}
                        {certTab === tab && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sunbird-brick rounded-t-full" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Current Certificate panel ── */}
                {hasExistingCert && certTab === "current" && (() => {
                  const entries = Object.entries(existingCertTemplates);
                  return (
                    <div className="p-6 space-y-5">
                      <h3 className="text-sm font-semibold text-sunbird-obsidian font-['Rubik'] uppercase tracking-wide">
                        Attached Certificate Templates
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {entries.map(([id, tmpl]: [string, any]) => {
                          const preview = tmpl?.artifactUrl ?? tmpl?.previewUrl ?? "";
                          const name = tmpl?.name ?? id;
                          return (
                            <div
                              key={id}
                              className="rounded-xl border-2 border-sunbird-brick/40 overflow-hidden bg-white shadow-sm"
                            >
                              <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative overflow-hidden">
                                {preview ? (
                                  <img src={preview} alt={name} className="object-cover w-full h-full" />
                                ) : (
                                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                    <FiAward className="w-8 h-8" />
                                    <span className="text-xs font-['Rubik']">No preview available</span>
                                  </div>
                                )}
                              </div>
                              <div className="px-3 py-2 border-t border-border">
                                <p className="text-xs font-semibold font-['Rubik'] text-foreground truncate">{name}</p>
                                <p className="text-xs text-muted-foreground font-['Rubik'] truncate mt-0.5">{id}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground font-['Rubik'] italic">
                        To replace this certificate, switch to the <strong>Change Certificate</strong> tab.
                      </p>
                    </div>
                  );
                })()}

                {/* ── Change Certificate panel (standard picker) ── */}
                {(!hasExistingCert || certTab === "change") && (
                  <div className="flex overflow-y-auto" style={{ maxHeight: "calc(90vh - 130px)" }}>
                  {/* LEFT — Certificate Rules */}
                  <div className="flex-1 border-r border-border p-6 space-y-5 overflow-y-auto">
                    <h3 className="text-sm font-semibold text-sunbird-obsidian font-['Rubik'] uppercase tracking-wide">
                      Certificate Rules
                    </h3>

                    <div>
                      <label htmlFor="issueTo" className={labelClass}>
                        Issue Certificate To
                      </label>
                      <div className="relative">
                        <select
                          id="issueTo"
                          value={issueTo}
                          onChange={(e) => setIssueTo(e.target.value as IssueTo)}
                          className={cn(inputClass, "appearance-none pr-8 cursor-pointer")}
                        >
                          <option value="all">All</option>
                          <option value="org">My Organisation Users</option>
                        </select>
                        <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Progress Rule — editable */}
                    <div>
                      <label htmlFor="progressRule" className={labelClass}>
                        Progress Rule (%)
                      </label>
                      <input
                        id="progressRule"
                        type="number"
                        min={1}
                        max={100}
                        className={inputClass}
                        value={progressRule}
                        onChange={(e) => setProgressRule(e.target.value)}
                      />
                    </div>

                    {/* Condition — mandatory checkbox */}
                    <div>
                      <label className={cn(labelClass, "flex items-center gap-1")}>
                        Condition
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={issueToAccepted}
                            onChange={(e) => setIssueToAccepted(e.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-amber-400 accent-sunbird-brick cursor-pointer"
                          />
                          <span className="text-xs text-amber-800 font-['Rubik'] leading-relaxed">
                            All the elements and attributes are thoroughly verified and I agree to issue
                            the certificate as per the rules set above.
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Selected Template</label>
                      <div
                        className={cn(
                          "rounded-xl border-2 border-dashed overflow-hidden transition-all",
                          selectedTemplate ? "border-sunbird-brick/40 bg-white" : "border-border bg-gray-50"
                        )}
                      >
                        {selectedTemplate ? (
                          <div>
                            <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                              {selectedTemplate.previewUrl ? (
                                <img
                                  src={selectedTemplate.previewUrl}
                                  alt={selectedTemplate.name}
                                  className="object-contain w-full h-full"
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                  <FiAward className="w-8 h-8" />
                                  <span className="text-xs font-['Rubik']">No preview</span>
                                </div>
                              )}
                            </div>
                            <div className="px-3 py-2 border-t border-border bg-white">
                              <p className="text-xs font-medium font-['Rubik'] text-foreground">
                                {selectedTemplate.name}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
                            <FiAward className="w-8 h-8" />
                            <p className="text-xs font-['Rubik']">Select a template from the right panel</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT — Certificate Templates */}
                  <div className="w-72 flex-shrink-0 p-4 space-y-3 overflow-y-auto bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-sunbird-obsidian font-['Rubik'] uppercase tracking-wide">
                        Certificate Template
                      </h3>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleRefreshTemplates}
                          disabled={templatesRefreshing}
                          title="Refresh templates"
                          className="p-1.5 rounded-lg border border-border bg-white text-muted-foreground hover:text-sunbird-brick hover:bg-sunbird-brick/8 transition-colors shadow-sm"
                        >
                          <FiRefreshCw className={cn("w-3.5 h-3.5", templatesRefreshing && "animate-spin")} />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setView("createTemplate"); setErrorMsg(""); }}
                          title="Create new template"
                          className="p-1.5 rounded-lg border border-border bg-white text-sunbird-brick hover:bg-sunbird-brick hover:text-white transition-colors shadow-sm"
                        >
                          <FiPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {templatesLoading && (
                      <div className="flex items-center justify-center py-8">
                        <FiLoader className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    )}

                    {!templatesLoading && certTemplates.length === 0 && (
                      <div className="text-center py-8">
                        <FiAward className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground font-['Rubik']">No templates available.</p>
                        <button
                          type="button"
                          onClick={() => { setView("createTemplate"); setErrorMsg(""); }}
                          className="mt-2 text-xs text-sunbird-brick hover:underline font-['Rubik']"
                        >
                          Create New Template
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {certTemplates.map((tmpl) => (
                        <TemplateThumbnail
                          key={tmpl.identifier}
                          name={tmpl.name}
                          previewUrl={tmpl.previewUrl}
                          selected={selectedTemplateId === tmpl.identifier}
                          onClick={() => setPreviewTemplate(tmpl.identifier)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-white">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg px-5 py-2 text-sm font-medium text-foreground bg-gray-100 hover:bg-gray-200 transition-colors font-['Rubik']"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!isAddCertEnabled}
                    onClick={handleAddCertificate}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors font-['Rubik']",
                      !isAddCertEnabled
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
            {step === "idle" && view === "createTemplate" && (
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

                  {/* Name */}
                  <div>
                    <label htmlFor="tmplName" className={labelClass}>
                      Name <span className="text-red-500">*</span>
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
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!isNewTmplValid || createLoading}
                    onClick={handleSaveNewTemplate}
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
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Template Preview Popup */}
      {previewTemplate && (() => {
        const tmpl = certTemplates.find((t) => t.identifier === previewTemplate);
        if (!tmpl) return null;
        return (
          <Dialog.Root
            open={!!previewTemplate}
            onOpenChange={(o) => { if (!o) setPreviewTemplate(null); }}
          >
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60" />
              <Dialog.Content
                className="fixed left-1/2 top-1/2 z-[60] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl focus:outline-none overflow-hidden"
                style={{ width: "min(90vw, 44rem)" }}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <Dialog.Title className="text-base font-semibold text-sunbird-obsidian font-['Rubik']">
                    {tmpl.name}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-gray-100 transition-colors"
                      aria-label="Close preview"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="p-5">
                  {tmpl.previewUrl ? (
                    <img
                      src={tmpl.previewUrl}
                      alt={tmpl.name}
                      className="w-full rounded-lg border border-border object-contain"
                      style={{ maxHeight: "60vh" }}
                    />
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center gap-3 bg-gray-50 rounded-lg border border-border"
                      style={{ height: "16rem" }}
                    >
                      <FiAward className="w-12 h-12 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground font-['Rubik']">No preview available</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="rounded-lg px-5 py-2 text-sm font-medium text-foreground bg-gray-100 hover:bg-gray-200 transition-colors font-['Rubik']"
                    >
                      Close
                    </button>
                  </Dialog.Close>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(tmpl.identifier);
                      setPreviewTemplate(null);
                    }}
                    className="rounded-lg px-5 py-2 text-sm font-medium text-white bg-sunbird-brick hover:bg-opacity-90 transition-colors font-['Rubik'] inline-flex items-center gap-2"
                  >
                    <FiCheck className="w-4 h-4" />
                    Select
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        );
      })()}
    </>
  );
};

export default AddCertificateModal;
