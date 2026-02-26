import { NewTemplateForm } from "./types";

export type Signatory = { name: string; designation: string; id: string; image: string };

/**
 * Returns a list of signatories. 
 * Prioritizes the full signatory list if provided, otherwise uses the last built list.
 * Defaults to a "Director" signatory if both are empty.
 */
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

/**
 * Builds a signatory list based on the new template form data.
 */
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
