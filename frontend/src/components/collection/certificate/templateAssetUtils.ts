import { NewTemplateForm } from "./types";
import { Signatory } from "./signatoryUtils";

/**
 * Validates if the new template form has all required fields.
 */
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

/**
 * Builds the request payload for creating a certificate asset.
 */
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

/**
 * Converts an image URL to a base64 string.
 */
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

/**
 * Generates a modified SVG string by updating specific elements with form data.
 */
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
