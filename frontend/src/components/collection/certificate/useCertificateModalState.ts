import { useState, useRef, useCallback, useEffect } from "react";
import { collectionService } from "@/services/collection";
import { useQueryClient } from "@tanstack/react-query";
import { certificateService } from "@/services/CertificateService";
import { useCertTemplates } from "@/hooks/useCertificate";
import { IssueTo, ModalView, Step, NewTemplateForm, CERT_TEMPLATE_SVG_URL } from "./types";
import { emptyNewTemplate, resolveUserAndOrg } from "./utils";
import { 
  Signatory, 
  buildSignatoryListFromForm 
} from "./signatoryUtils";
import { 
  isNewTemplateValid, 
  buildCreateAssetRequest, 
  generateModifiedSvg 
} from "./templateAssetUtils";
import { runAddCertificate } from "./certificateOperationHandlers";

export function useCertificateModalState(
  courseId: string,
  batchId: string,
  existingCertTemplates: Record<string, unknown> = {},
  onOpenChange: (open: boolean) => void
) {
  const queryClient = useQueryClient();

  /* State */
  const [view, setView] = useState<ModalView>("main");
  const hasExistingCert = Object.keys(existingCertTemplates).length > 0;
  
  // Extract the single/latest existing certificate if one is present
  const singleExistingCertId = hasExistingCert ? Object.keys(existingCertTemplates).pop() : null;
  const singleExistingCertData = singleExistingCertId ? existingCertTemplates[singleExistingCertId] : null;

  const [certTab, setCertTab] = useState<"current" | "change">(hasExistingCert ? "current" : "change");

  type CertCriteria = { user?: { rootOrgId?: string }; assessment?: { score?: { ">="?: number } } };
  const parsedCriteria = (singleExistingCertData as { criteria?: CertCriteria })?.criteria;

  // Determine initial Issue To value
  let initialIssueTo: IssueTo = "all";
  if (parsedCriteria?.user?.rootOrgId) {
    initialIssueTo = "org";
  }

  // Determine initial Score Rule values
  let initialEnableScoreRule = false;
  let initialScoreRuleValue = "90";
  const assessmentScore = parsedCriteria?.assessment?.score?.['>='];
  if (assessmentScore !== undefined) {
    initialEnableScoreRule = true;
    initialScoreRuleValue = String(assessmentScore);
  }

  const [issueTo, setIssueTo] = useState<IssueTo>(initialIssueTo);
  const [issueToAccepted, setIssueToAccepted] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(singleExistingCertId || null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [newTmpl, setNewTmpl] = useState<NewTemplateForm>(emptyNewTemplate());
  const [step, setStep] = useState<Step>("idle");
  const [stepLabel, setStepLabel] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [templatesRefreshing, setTemplatesRefreshing] = useState(false);
  
  // New Score Rule States
  const [showScoreRuleComponent, setShowScoreRuleComponent] = useState(false);
  const [enableScoreRule, setEnableScoreRule] = useState(initialEnableScoreRule);
  const [scoreRuleValue, setScoreRuleValue] = useState(initialScoreRuleValue);

  const { data: certTemplates = [], isLoading: templatesLoading } = useCertTemplates();

  const lastBuiltSignatoryListRef = useRef<Signatory[]>([]);

  // Fetch Course Hierarchy to determine if Score Rule should be shown
  useEffect(() => {
    async function checkHierarchy() {
      try {
        const response = await collectionService.getHierarchy(courseId);
        const metadata = response.data?.content;
        
        if (metadata?.contentTypesCount) {
          const parsedCount = JSON.parse(metadata.contentTypesCount);
          if (parsedCount["SelfAssess"] === 1) {
            setShowScoreRuleComponent(true);
          }
        }
      } catch (err) {
        console.error("Failed to fetch course hierarchy", err);
      }
    }
    checkHierarchy();
  }, [courseId]);

  const selectedTemplate = certTemplates.find((t) => t.identifier === selectedTemplateId);

  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    resetTimeoutRef.current = setTimeout(() => {
      setView("main");
      setIssueTo("all");
      setIssueToAccepted(false);
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
      const modifiedSvg = await generateModifiedSvg(svgText, newTmpl);

      const svgBlob = new Blob([modifiedSvg], { type: "image/svg+xml" });

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
      lastBuiltSignatoryListRef.current = await runAddCertificate({
        courseId, batchId, selectedTemplateId, selectedTemplate,
        issueTo, rootOrgId, enableScoreRule, scoreRuleValue,
        lastBuiltSignatoryList: lastBuiltSignatoryListRef.current,
        singleExistingCertId,
        reqHeaders,
        setStepLabel, setStep, setErrorMsg,
        queryClient,
      });
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
    selectedTemplateId, setSelectedTemplateId,
    previewTemplate, setPreviewTemplate,
    newTmpl,
    step, setStep,
    stepLabel,
    errorMsg, setErrorMsg,
    createLoading,
    templatesRefreshing,
    certTab, setCertTab,
    showScoreRuleComponent,
    enableScoreRule, setEnableScoreRule,
    scoreRuleValue, setScoreRuleValue,
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
