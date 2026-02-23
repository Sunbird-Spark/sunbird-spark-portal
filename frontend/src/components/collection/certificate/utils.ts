import { ImagePickerState, NewTemplateForm } from "./types";

export const emptyImage = (): ImagePickerState => ({
  preview: null,
  artifactUrl: null,
  file: null,
});

export const emptyNewTemplate = (): NewTemplateForm => ({
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

export { resolveUserAndOrg } from "@/utils/userUtils";
