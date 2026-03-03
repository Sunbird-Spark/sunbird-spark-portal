import { AddTemplateRequest } from "@/services/CertificateService";
import { Signatory, resolveSignatoryList } from "./signatoryUtils";

/**
 * Builds the request payload for adding a certificate template to a batch.
 */
export function buildAddTemplateRequestPayload(
  courseId: string,
  batchId: string,
  selectedTemplateId: string,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  selectedTemplate: any,
  /* eslint-enable @typescript-eslint/no-explicit-any */
  issueTo: string,
  rootOrgId: string,
  enableScoreRule: boolean,
  scoreRuleValue: string,
  fullSignatoryList: Signatory[] | undefined,
  lastBuiltSignatoryList: Signatory[],
  fullPreviewUrl: string,
  fullIssuer: unknown
): AddTemplateRequest {
  const criteria: {
    enrollment: { status: number };
    user?: { rootOrgId: string };
    assessment?: { score: { ">=": number } };
  } = {
    enrollment: { status: 2 },
  };
  if (issueTo === "org") {
    criteria.user = { rootOrgId };
  }
  if (enableScoreRule) {
    criteria.assessment = { score: { ">=": Number(scoreRuleValue) || 90 } };
  }

  const signatoryList = resolveSignatoryList(fullSignatoryList, lastBuiltSignatoryList);

  return {
    batch: {
      courseId,
      batchId,
      template: {
        identifier: selectedTemplateId,
        criteria,
        name: selectedTemplate.name,
        issuer: (fullIssuer as { name: string; url: string; }) ?? { name: rootOrgId, url: window.location.origin },
        previewUrl: fullPreviewUrl,
        signatoryList,
      },
    },
  };
}
