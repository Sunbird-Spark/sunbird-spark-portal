import { NewTemplateForm } from "./types";

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

export function applyOptimisticBatchCertUpdate(oldBatches: any[] | undefined, batchId: string, selectedTemplateId: string, selectedTemplate: any) {
  if (!oldBatches) return oldBatches;
  return oldBatches.map((b) => {
    if (b.id === batchId) {
      return {
        ...b,
        certTemplates: {
          ...(b.certTemplates || {}),
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
