import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { certificateService } from "@/services/CertificateService";
import { useCertTemplates } from "@/hooks/useCertificate";
import { IssueTo, ModalView, Step, NewTemplateForm, CERT_TEMPLATE_SVG_URL } from "./types";
import { emptyNewTemplate, resolveUserAndOrg } from "./utils";
import {
  Signatory,
  resolveSignatoryList,
  buildSignatoryListFromForm,
  isNewTemplateValid,
  buildCreateAssetRequest,
  applyOptimisticBatchCertUpdate,
} from "./useCertificateModalState.helpers";

export function useCertificateModalState(
  courseId: string,
  batchId: string,
  existingCertTemplates: Record<string, any> = {},
  onOpenChange: (open: boolean) => void
) {
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

  const hasExistingCert = Object.keys(existingCertTemplates).length > 0;
  const [certTab, setCertTab] = useState<"current" | "change">(hasExistingCert ? "current" : "change");

  const { data: certTemplates = [], isLoading: templatesLoading } = useCertTemplates();

  const lastBuiltSignatoryListRef = useRef<Signatory[]>([]);

  const selectedTemplate = certTemplates.find((t) => t.identifier === selectedTemplateId);

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
  }, [onOpenChange, hasExistingCert]);

  const handleNewTmplField = <K extends keyof NewTemplateForm>(
    key: K,
    value: NewTemplateForm[K]
  ) => {
    setNewTmpl((prev) => ({ ...prev, [key]: value }));
  };

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

      const sigList = buildSignatoryListFromForm(newTmpl);
      const reqBody = buildCreateAssetRequest(newTmpl, rootOrgId, sigList);
      const createResp = await certificateService.createAsset(reqBody, reqHeaders);

      const assetId = createResp.data?.identifier;
      if (!assetId) throw new Error("Failed to create certificate asset");

      const svgResp = await fetch(CERT_TEMPLATE_SVG_URL);
      if (!svgResp.ok) throw new Error("Failed to fetch certificate SVG template");
      const svgText = await svgResp.text();
      const svgBlob = new Blob([svgText], { type: "image/svg+xml" });

      const now = new Date();
      const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}_${String(now.getMinutes()).padStart(2, "0")}`;
      await certificateService.uploadAsset(assetId, svgBlob, `certificate_${ts}.svg`, reqHeaders);

      lastBuiltSignatoryListRef.current =
        sigList.length > 0
          ? sigList
          : [{ name: "Director", designation: "", id: "Director/Director", image: "" }];

      await queryClient.invalidateQueries({ queryKey: ["certTemplates"] });
      setSelectedTemplateId(assetId);
      setView("main");
      setStep("templateCreated");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create template.");
    } finally {
      setCreateLoading(false);
    }
  };

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

      setStepLabel("Fetching template details…");
      let fullSignatoryList: Signatory[] | undefined;
      let fullPreviewUrl = selectedTemplate.previewUrl ?? selectedTemplate.artifactUrl ?? "";
      let fullIssuer = selectedTemplate.issuer;
      try {
        const readResp = await certificateService.readCertTemplate(selectedTemplateId);
        const content = readResp.data?.content as any;
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
        // Fall through
      }

      setStepLabel("Attaching certificate to batch…");
      const criteria: { enrollment: { status: number }; user?: { rootOrgId: string } } = {
        enrollment: { status: 2 },
      };
      if (issueTo === "org") {
        criteria.user = { rootOrgId };
      }

      const signatoryList = resolveSignatoryList(fullSignatoryList, lastBuiltSignatoryListRef.current);

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

      // Optimistically update the cache so the UI reflects instantly
      queryClient.setQueryData<any[]>(["batchList", courseId, true], (old) =>
        applyOptimisticBatchCertUpdate(old, batchId, selectedTemplateId, selectedTemplate)
      );

      // Invalidate after a delay for ES to index
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["batchList", courseId] });
      }, 2000);

      setStep("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
      setStep("error");
    }
  };

  const isNewTmplValid = isNewTemplateValid(newTmpl);

  const handleRefreshTemplates = async () => {
    setTemplatesRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["certTemplates"] });
    setTemplatesRefreshing(false);
  };

  const isAddCertEnabled = !!selectedTemplateId && issueToAccepted;

  return {
    view, setView,
    issueTo, setIssueTo,
    issueToAccepted, setIssueToAccepted,
    progressRule, setProgressRule,
    selectedTemplateId, setSelectedTemplateId,
    previewTemplate, setPreviewTemplate,
    newTmpl,
    step, setStep,
    stepLabel,
    errorMsg, setErrorMsg,
    createLoading,
    templatesRefreshing,
    certTab, setCertTab,
    certTemplates, templatesLoading, selectedTemplate,
    hasExistingCert,
    handleClose,
    handleNewTmplField,
    handleSaveNewTemplate,
    handleAddCertificate,
    isNewTmplValid,
    handleRefreshTemplates,
    isAddCertEnabled,
  };
}
