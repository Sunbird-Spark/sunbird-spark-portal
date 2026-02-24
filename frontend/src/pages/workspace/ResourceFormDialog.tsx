import { type FormEvent, useEffect, useRef } from "react";
import { Button } from "@/components/common/Button";
import ResourceFormContent from "./ResourceFormContent";
import { useResourceForm } from "../../hooks/useResourceForm";

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

export interface ResourceFormData {
  name: string;
  description: string;
  dynamicFields: Record<string, string | string[] | number>;
}

interface ResourceFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ResourceFormData) => void;
  isLoading?: boolean;
  orgChannelId: string;
  orgFramework: string;
  formSubType?: string;
  title?: string;
}

const processFormSubmission = (
  formValues: Record<string, string | string[]>,
  fields: FormField[]
): ResourceFormData => {
  const nameValue = ((formValues['name'] as string) || '').trim() || 'Untitled content';
  const dynamicFields: Record<string, string | string[] | number> = {};
  
  for (const field of fields) {
    if (field.code === 'name' || field.code === 'description') continue;
    const val = formValues[field.code];
    if (val && (typeof val === 'string' ? val.trim() : val.length > 0)) {
      if (field.inputType === 'number' && typeof val === 'string') {
        const num = Number(val);
        if (!isNaN(num)) {
          dynamicFields[field.code] = num;
          continue;
        }
      }
      dynamicFields[field.code] = val;
    }
  }

  return {
    name: nameValue,
    description: ((formValues['description'] as string) || 'Enter description for Resource').trim(),
    dynamicFields,
  };
};

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-12 gap-3">
    <div className="w-8 h-8 border-3 border-sunbird-wave/30 border-t-sunbird-wave rounded-full animate-spin" />
    <p className="text-sm text-muted-foreground font-rubik">Loading form...</p>
  </div>
);

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3">
    <p className="text-sm text-red-600 font-rubik">{error}</p>
    <Button type="button" size="sm" onClick={onRetry} className="bg-sunbird-brick hover:bg-sunbird-brick/90 text-white">
      Retry
    </Button>
  </div>
);

export default function ResourceFormDialog({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  orgChannelId,
  orgFramework,
  formSubType = 'resource',
  title = 'Create Content',
}: ResourceFormDialogProps) {
  const {
    fields,
    formValues,
    isFetchingForm,
    fetchError,
    openDropdown,
    setOpenDropdown,
    fetchAttempted,
    fetchFormAndFramework,
    getOptionsForField,
    handleFieldChange,
    handleMultiSelectToggle,
    canSubmit,
  } = useResourceForm(open, orgChannelId, orgFramework, formSubType);

  const dropdownRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isLoading, onClose]);

  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e: Event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown, setOpenDropdown]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(processFormSubmission(formValues, fields));
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold font-rubik text-foreground mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground mb-4 font-rubik">Fill in the details to create your content</p>
        {isFetchingForm && <LoadingState />}
        {fetchError && <ErrorState error={fetchError} onRetry={() => { fetchAttempted.current = false; fetchFormAndFramework(); }} />}
        {!isFetchingForm && !fetchError && fields.length > 0 && (
          <ResourceFormContent
            fields={fields}
            formValues={formValues}
            isLoading={isLoading}
            openDropdown={openDropdown}
            canSubmit={canSubmit}
            getOptionsForField={getOptionsForField}
            onFieldChange={handleFieldChange}
            onMultiSelectToggle={handleMultiSelectToggle}
            onDropdownToggle={setOpenDropdown}
            onSubmit={handleSubmit}
            onClose={onClose}
            dropdownRef={dropdownRef}
          />
        )}
      </div>
    </div>
  );
}
