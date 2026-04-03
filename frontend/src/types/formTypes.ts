import { ContentSearchRequest } from './workspaceTypes';

export interface FormReadRequest {
  type: string;
  subType?: string;
  action: string;
  component?: string;
  rootOrgId?: string;
  framework?: string;
}
export interface FormReadResponse {
  form: {
    framework: string;
    type: string;
    subtype: string;
    action: string;
    component: string;
    data: any;
    created_on: string;
    last_modified_on: string;
    rootOrgId: string;
  };
}

export interface FormSection {
  id: string;
  index: number;
  title: string | Record<string, string>;
  type: 'content' | 'categories' | 'resources';
  criteria?: {
    request: ContentSearchRequest;
  };
  list?: CategoryItem[];
}

export interface CategoryItem {
  id: string;
  index: number;
  title: string | Record<string, string>;
  code: string;
  value: string;
}

export interface CheckListFormFieldContent {
  name: string;
  checkList: string[];
}

export interface CheckListFormField {
  title: string;
  contents?: CheckListFormFieldContent[];
  otherReason?: string;
}

export interface UseFormReadOptions {
  request: FormReadRequest;
  enabled?: boolean;
}

export interface ExploreFilterOption {
  id: string;
  index: number;
  label: string | Record<string, string>; // Can be a string or object with language codes
  code: string;
  value: string | string[];
}

export interface ExploreFilterGroup {
  id: string;
  index: number;
  label: string | Record<string, string>; // Can be a string or object with language codes
  options?: ExploreFilterOption[];
  list?: ExploreFilterOption[];
}

export interface OnboardingField {
  id: string;
  index: number;
  label: string | Record<string, string>;
  nextScreenId?: string;
  requiresTextInput?: boolean;
}

export interface OnboardingScreen {
  title: string | Record<string, string>;
  selectionType: "single" | "multiple";
  nextScreenId?: string;
  fields: OnboardingField[];
}

export interface OnboardingFormData {
  isEnabled: boolean;
  initialScreenId: string;
  screens: Record<string, OnboardingScreen>;
}
