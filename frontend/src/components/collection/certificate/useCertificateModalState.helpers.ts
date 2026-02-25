import { NewTemplateForm } from "./types";
import { certificateService, AddTemplateRequest } from "@/services/CertificateService";

export type Signatory = { name: string; designation: string; id: string; image: string };

export function resolveSignatoryList(
  fullSignatoryList: Signatory[] | undefined,
  lastBuiltSignatoryList: Signatory[]
) {
  if (fullSignatoryList && fullSignatoryList.length > 0) {
    return fullSignatoryList;
  }
  if (lastBuiltSignatoryList && lastBuiltSignatoryList.length > 0) {
    return lastBuiltSignatoryList;
  }
  return [{ name: "Director", designation: "", id: "Director/Director", image: "" }];
}

export function buildSignatoryListFromForm(newTmpl: NewTemplateForm): Signatory[] {
  const sigList: Signatory[] = [];
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
  return sigList;
}

export function isNewTemplateValid(newTmpl: NewTemplateForm): boolean {
  return Boolean(
    newTmpl.certTitle.trim() &&
    newTmpl.name.trim() &&
    !!newTmpl.logo1.preview &&
    !!newTmpl.sig1.preview &&
    !!newTmpl.sig1Designation.trim() &&
    newTmpl.termsAccepted
  );
}

export function buildCreateAssetRequest(newTmpl: NewTemplateForm, rootOrgId: string, sigList: Signatory[]) {
  const assetCode = newTmpl.certTitle.trim() || "Certificate";
  return {
    name: assetCode,
    code: assetCode,
    mimeType: "image/svg+xml" as const,
    license: "CC BY 4.0",
    primaryCategory: "Certificate Template" as const,
    mediaType: "image" as const,
    certType: "cert template" as const,
    channel: rootOrgId,
    issuer: { name: rootOrgId, url: window.location.origin },
    signatoryList:
      sigList.length > 0
        ? sigList
        : [{ name: "Director", designation: "", id: "Director/Director", image: "" }],
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function applyOptimisticBatchCertUpdate(oldBatches: any[] | undefined, batchId: string, selectedTemplateId: string, selectedTemplate: any) {
/* eslint-enable @typescript-eslint/no-explicit-any */
  if (!oldBatches) return oldBatches;
  return oldBatches.map((b) => {
    if (b.id === batchId) {
      return {
        ...b,
        certTemplates: {
          [selectedTemplateId]: {
            identifier: selectedTemplateId,
            name: selectedTemplate.name,
          },
        },
      };
    }
    return b;
  });
}

export async function getBase64Image(url: string): Promise<string> {
  if (url.startsWith("data:")) return url;
  try {
    const r = await fetch(url);
    if (!r.ok) return url;
    const blob = await r.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

export async function generateModifiedSvg(svgText: string, newTmpl: NewTemplateForm): Promise<string> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");

  if (newTmpl.certTitle) {
    const el = doc.getElementById("certTitle");
    if (el) el.textContent = newTmpl.certTitle;
  }

  if (newTmpl.name) {
    const el = doc.getElementById("stateTitle");
    if (el) el.textContent = newTmpl.name;
  }

  if (newTmpl.logo1?.preview) {
    const logo1B64 = await getBase64Image(newTmpl.logo1.preview);
    const el = doc.getElementById("stateLogo1");
    if (el) {
      el.setAttribute("href", logo1B64);
      el.setAttribute("xlink:href", logo1B64);
    }
  }

  if (newTmpl.logo2?.preview) {
    const logo2B64 = await getBase64Image(newTmpl.logo2.preview);
    const el = doc.getElementById("stateLogo2");
    if (el) {
      el.setAttribute("href", logo2B64);
      el.setAttribute("xlink:href", logo2B64);
    }
  }

  if (newTmpl.sig1?.preview) {
    const sig1B64 = await getBase64Image(newTmpl.sig1.preview);
    const el = doc.getElementById("signatureImg1");
    if (el) {
      el.setAttribute("href", sig1B64);
      el.setAttribute("xlink:href", sig1B64);
    }
  }

  if (newTmpl.sig1Designation || newTmpl.name) {
    const sigNames = [newTmpl.name, newTmpl.sig1Designation].filter(Boolean).join(", ");
    const el = doc.getElementById("signatureTitle1");
    if (el) el.textContent = sigNames;
  }

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}

export async function fetchTemplateDetails(selectedTemplateId: string, defaultPreviewUrl: string, defaultIssuer: unknown) {
  let fullSignatoryList: Signatory[] | undefined;
  let fullPreviewUrl = defaultPreviewUrl;
  let fullIssuer = defaultIssuer;
  try {
    const readResp = await certificateService.readCertTemplate(selectedTemplateId);
    const content = readResp.data?.content;
    if (content) {
      if (Array.isArray(content.signatoryList) && content.signatoryList.length > 0) {
        fullSignatoryList = content.signatoryList.map((s: Record<string, unknown>) => {
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
      if (content.artifactUrl) fullPreviewUrl = content.artifactUrl;
      if (content.issuer) fullIssuer = content.issuer;
    }
  } catch {
    // Fall through
  }
  return { fullSignatoryList, fullPreviewUrl, fullIssuer };
}

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
