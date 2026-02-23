export const CERT_TEMPLATE_SVG_URL = "https://downloadableartifacts.blob.core.windows.net/release600/certificate_template.svg";

export interface AddCertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  batchId: string;
  courseName?: string;
  existingCertTemplates?: Record<string, any>;
}

export type IssueTo = "all" | "org";

export interface ImagePickerState {
  preview: string | null;
  artifactUrl: string | null;
  file: File | null;
}

export interface NewTemplateForm {
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

export type ModalView = "main" | "createTemplate";
export type Step = "idle" | "submitting" | "done" | "error" | "templateCreated";
export type ImageTab = "myImages" | "allImages" | "upload";
