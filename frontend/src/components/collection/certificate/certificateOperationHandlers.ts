import { Step } from "./types";
import { certificateService, CertTemplateSummary } from "@/services/CertificateService";
import { Signatory, resolveSignatoryList } from "./signatoryUtils";
import { buildAddTemplateRequestPayload } from "./certificateRequestBuilders";
import { applyOptimisticBatchCertUpdate } from "./certificateCacheUtils";

/**
 * Fetches the full details of a template from the server.
 */
export async function fetchTemplateDetails(selectedTemplateId: string, defaultPreviewUrl: string, defaultIssuer: unknown) {
  let fullSignatoryList: Signatory[] | undefined;
  let fullPreviewUrl = defaultPreviewUrl;
  let fullIssuer = defaultIssuer;
  try {
    const readResp = await certificateService.readCertTemplate(selectedTemplateId);
    const content = readResp.data?.content as Record<string, unknown> | undefined;
    if (content) {
      if (Array.isArray(content['signatoryList']) && (content['signatoryList'] as unknown[]).length > 0) {
        fullSignatoryList = (content['signatoryList'] as Record<string, unknown>[]).map((s) => {
          const name = (s.name as string) ?? "";
          const designation = (s.designation as string) ?? "";
          return {
            name,
            designation,
            id: (s.id as string) ?? `${name || "Unknown"}/${designation || "Unknown"}`,
            image: (s.image as string) ?? "",
          };
        });
      }
      if (content['artifactUrl']) fullPreviewUrl = content['artifactUrl'] as string;
      if (content['issuer']) fullIssuer = content['issuer'];
    }
  } catch {
    // Fall through
  }
  return { fullSignatoryList, fullPreviewUrl, fullIssuer };
}

export interface AddCertParams {
  courseId: string;
  batchId: string;
  selectedTemplateId: string;
  selectedTemplate: CertTemplateSummary;
  issueTo: string;
  rootOrgId: string;
  enableScoreRule: boolean;
  scoreRuleValue: string;
  lastBuiltSignatoryList: Signatory[];
  singleExistingCertId: string | null | undefined;
  reqHeaders: Record<string, string>;
  setStepLabel: (label: string) => void;
  setStep: (step: Step) => void;
  setErrorMsg: (msg: string) => void;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  queryClient: { setQueryData: any; invalidateQueries: any };
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

/**
 * Orchestrates the process of adding a certificate to a batch.
 */
export async function runAddCertificate(params: AddCertParams): Promise<Signatory[]> {
  const {
    courseId, batchId, selectedTemplateId, selectedTemplate,
    issueTo, rootOrgId, enableScoreRule, scoreRuleValue,
    lastBuiltSignatoryList, singleExistingCertId,
    reqHeaders, setStepLabel, setStep, setErrorMsg, queryClient,
  } = params;

  try {
    setStepLabel("Fetching template details…");
    const { 
        fullSignatoryList: fetchedSignatories, 
        fullPreviewUrl, 
        fullIssuer 
    } = await fetchTemplateDetails(
        selectedTemplateId, 
        selectedTemplate.previewUrl ?? selectedTemplate.artifactUrl ?? "", 
        selectedTemplate.issuer
    );

    setStepLabel("Attaching certificate to batch…");
    const requestPayload = buildAddTemplateRequestPayload(
      courseId, batchId, selectedTemplateId, selectedTemplate,
      issueTo, rootOrgId, enableScoreRule, scoreRuleValue,
      fetchedSignatories, lastBuiltSignatoryList,
      fullPreviewUrl, fullIssuer
    );

    if (singleExistingCertId) {
      setStepLabel("Removing old certificate...");
      await certificateService.removeTemplateFromBatch(
        { batch: { courseId, batchId, template: { identifier: singleExistingCertId } } },
        reqHeaders
      );
    }

    setStepLabel("Attaching new certificate to batch…");
    await certificateService.addTemplateToBatch(requestPayload, reqHeaders);

    queryClient.setQueryData(["batchList", courseId, true], (old: unknown[]) =>
      applyOptimisticBatchCertUpdate(old, batchId, selectedTemplateId, selectedTemplate)
    );
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["batchList", courseId] });
    }, 2000);

    setStep("done");
    return resolveSignatoryList(fetchedSignatories, lastBuiltSignatoryList);
  } catch (err) {
    setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
    setStep("error");
    return lastBuiltSignatoryList;
  }
}
