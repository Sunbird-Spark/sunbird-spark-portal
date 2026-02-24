import React, { type FormEvent } from "react";
import { Button } from "@/components/common/Button";
import ResourceFormField from "./ResourceFormField";

interface FormField {
  code: string;
  name: string;
  label: string;
  description: string;
  inputType: string;
  required: boolean;
  editable: boolean;
  visible: boolean;
  placeholder: string;
  index: number;
  range?: { key: string; name: string }[];
  renderingHints?: { semanticColumnWidth?: string };
}

interface ResourceFormContentProps {
  fields: FormField[];
  formValues: Record<string, string | string[]>;
  isLoading: boolean;
  openDropdown: string | null;
  canSubmit: boolean;
  getOptionsForField: (field: FormField) => { key: string; name: string }[];
  onFieldChange: (code: string, value: string | string[]) => void;
  onMultiSelectToggle: (code: string, optionKey: string) => void;
  onDropdownToggle: (dropdown: string | null) => void;
  onSubmit: (e: FormEvent) => void;
  onClose: () => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
}

export default function ResourceFormContent({
  fields,
  formValues,
  isLoading,
  openDropdown,
  canSubmit,
  getOptionsForField,
  onFieldChange,
  onMultiSelectToggle,
  onDropdownToggle,
  onSubmit,
  onClose,
  dropdownRef,
}: ResourceFormContentProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        {fields.map((field) => (
          <ResourceFormField
            key={field.code}
            field={field}
            value={formValues[field.code] || (field.inputType === 'multiSelect' ? [] : '')}
            options={getOptionsForField(field)}
            isLoading={isLoading}
            openDropdown={openDropdown}
            onFieldChange={onFieldChange}
            onMultiSelectToggle={onMultiSelectToggle}
            onDropdownToggle={onDropdownToggle}
            dropdownRef={dropdownRef}
          />
        ))}
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!canSubmit || isLoading}
          className="bg-sunbird-brick hover:bg-sunbird-brick/90 text-white"
        >
          {isLoading ? "Creating..." : "Create"}
        </Button>
      </div>
    </form>
  );
}