import React from "react";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/common/Button";
import ResourceFormField from "../../components/common/FormFields";
import { useFormRead } from "../../hooks/useForm";
import { useFramework } from "../../hooks/useFramework";
import "./ResourceForm.css";

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
  onFormLoadStart?: () => void;
  onFormLoadComplete?: () => void;
}

const processFormSubmission = ( formValues: Record<string, string | string[]>, fields: FormField[]): ResourceFormData => {
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

const createFormDefaults = (fields: FormField[]): Record<string, string | string[]> => {
  const defaults: Record<string, string | string[]> = {};
  for (const field of fields) {
    defaults[field.code] = field.inputType === 'multiSelect' ? [] : '';
  }
  return defaults;
};

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="resource-form-error-state">
    <p className="resource-form-error-text">{error}</p>
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
  onFormLoadStart,
  onFormLoadComplete,
}: ResourceFormDialogProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string | string[]>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const { data: formData, isLoading: isFormLoading, error: formError, refetch: refetchForm } = useFormRead({
    request: {
      type: 'content',
      action: 'create',
      subType: formSubType,
      rootOrgId: orgChannelId || '*',
      framework: orgFramework || '*',
    },
    enabled,
  });

  const { data: frameworkData, isLoading: isFrameworkLoading, error: frameworkError, refetch: refetchFramework } = useFramework(
    enabled && orgFramework ? orgFramework : ''
  );

  const fields = useMemo(() => {
    const formFields: FormField[] = formData?.data?.form?.data?.fields ?? [];
    return [...formFields]
      .filter((f) => f.visible && f.inputType !== 'Concept')
      .sort((a, b) => a.index - b.index);
  }, [formData]);

  const frameworkCategories = useMemo(() => {
    return frameworkData?.data?.framework?.categories ?? [];
  }, [frameworkData]);

  const isFetchingForm = isFormLoading || isFrameworkLoading;
  const fetchError = formError || frameworkError 
    ? 'Failed to load form configuration. Please try again.' 
    : null;

  useEffect(() => {
    if (fields.length > 0) {
      setFormValues(createFormDefaults(fields));
    }
  }, [fields]);

  const getOptionsForField = useCallback((field: FormField): { key: string; name: string }[] => {
    if (field.range && field.range.length > 0) return field.range;
    const category = frameworkCategories.find((cat: { code: string; terms?: { name: string; code: string }[] }) => cat.code === field.code);
    if (category?.terms) {
      return category.terms.map((term: { name: string; code: string }) => ({ key: term.name, name: term.name }));
    }
    return [];
  }, [frameworkCategories]);

  const handleFieldChange = useCallback((code: string, value: string | string[]) => {
    setFormValues((prev) => ({ ...prev, [code]: value }));
  }, []);

  const handleMultiSelectToggle = useCallback((code: string, optionKey: string) => {
    setFormValues((prev) => {
      const current = (prev[code] as string[]) || [];
      const next = current.includes(optionKey)
        ? current.filter((v) => v !== optionKey)
        : [...current, optionKey];
      return { ...prev, [code]: next };
    });
  }, []);

  const canSubmit = useMemo(() => {
    return fields.every((field) => {
      if (!field.required) return true;
      const val = formValues[field.code];
      if (Array.isArray(val)) return val.length > 0;
      return typeof val === 'string' && val.trim().length > 0;
    });
  }, [fields, formValues]);

  const resetState = useCallback(() => {
    setFormValues({});
    setOpenDropdown(null);
    setEnabled(false);
  }, []);

  const handleRetry = useCallback(() => {
    refetchForm();
    if (orgFramework) {
      refetchFramework();
    }
  }, [refetchForm, refetchFramework, orgFramework]);

  const dropdownRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    if (open && !enabled) {
      onFormLoadStart?.();
      setEnabled(true);
    }
    if (!open) {
      setShowDialog(false);
      resetState();
    }
  }, [open, enabled, resetState, onFormLoadStart]);

  useEffect(() => {
    if (enabled && !isFetchingForm && (formData || formError)) {
      setShowDialog(true);
      onFormLoadComplete?.();
    }
  }, [enabled, isFetchingForm, formData, formError, onFormLoadComplete]);

  useEffect(() => {
    if (!showDialog) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDialog, isLoading, onClose]);

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

  if (isFetchingForm) {
    return (
      <div className="loading-overlay">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (!showDialog) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(processFormSubmission(formValues, fields));
  };

  return (
    <div
      className="resource-form-overlay"
      onClick={isLoading ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="resource-form-container"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="resource-form-title">{title}</h2>
        <p className="resource-form-subtitle">Fill in the details to create your content</p>
        {fetchError && <ErrorState error={fetchError} onRetry={handleRetry} />}
        {!fetchError && fields.length > 0 && (
          <form onSubmit={handleSubmit}>
            <div className="resource-form-fields">
              {fields.map((field) => (
                <ResourceFormField key={field.code} field={field} value={formValues[field.code] || (field.inputType === 'multiSelect' ? [] : '')} options={getOptionsForField(field)} isLoading={isLoading} openDropdown={openDropdown} onFieldChange={handleFieldChange} onMultiSelectToggle={handleMultiSelectToggle} onDropdownToggle={setOpenDropdown} dropdownRef={dropdownRef} />
              ))}
            </div>
            <div className="resource-form-actions">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>Cancel</Button>
              <Button type="submit" size="sm" disabled={!canSubmit || isLoading} className="bg-sunbird-brick hover:bg-sunbird-brick/90 text-white">{isLoading ? "Creating..." : "Create"}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
