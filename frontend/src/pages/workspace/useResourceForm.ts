import { useCallback, useEffect, useRef, useState } from "react";
import { FormService } from "@/services/FormService";
import { FrameworkService } from "@/services/FrameworkService";

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

interface FrameworkCategory {
  code: string;
  terms?: { name: string; code: string }[];
}

const formService = new FormService();
const frameworkService = new FrameworkService();

const createFormDefaults = (fields: FormField[]): Record<string, string | string[]> => {
  const defaults: Record<string, string | string[]> = {};
  for (const field of fields) {
    defaults[field.code] = field.inputType === 'multiSelect' ? [] : '';
  }
  return defaults;
};

export const useResourceForm = (
  open: boolean,
  orgChannelId: string,
  orgFramework: string,
  formSubType: string
) => {
  const [fields, setFields] = useState<FormField[]>([]);
  const [frameworkCategories, setFrameworkCategories] = useState<FrameworkCategory[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string | string[]>>({});
  const [isFetchingForm, setIsFetchingForm] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const fetchAttempted = useRef(false);

  const resetState = useCallback(() => {
    setFields([]);
    setFrameworkCategories([]);
    setFormValues({});
    setFetchError(null);
    setOpenDropdown(null);
    fetchAttempted.current = false;
  }, []);

  const fetchFormAndFramework = useCallback(async () => {
    setIsFetchingForm(true);
    setFetchError(null);
    try {
      const formResponse = await formService.formRead({
        type: 'content',
        action: 'create',
        subType: formSubType,
        rootOrgId: orgChannelId || '*',
        framework: orgFramework || '*',
      });

      const formFields: FormField[] = formResponse?.data?.form?.data?.fields ?? [];
      const sortedFields = [...formFields]
        .filter((f) => f.visible && f.inputType !== 'Concept')
        .sort((a, b) => a.index - b.index);
      setFields(sortedFields);
      setFormValues(createFormDefaults(sortedFields));

      if (orgFramework) {
        try {
          const fwResponse = await frameworkService.read<{ framework: { categories?: FrameworkCategory[] } }>(orgFramework);
          const categories = fwResponse?.data?.framework?.categories ?? [];
          setFrameworkCategories(categories);
        } catch (fwErr) {
          console.warn('Failed to fetch framework:', fwErr);
        }
      }
    } catch (err) {
      console.error('Failed to fetch form config:', err);
      setFetchError('Failed to load form configuration. Please try again.');
    } finally {
      setIsFetchingForm(false);
    }
  }, [orgChannelId, orgFramework, formSubType]);

  useEffect(() => {
    if (open && !fetchAttempted.current) {
      fetchAttempted.current = true;
      fetchFormAndFramework();
    }
    if (!open) resetState();
  }, [open, fetchFormAndFramework, resetState]);

  const getOptionsForField = (field: FormField): { key: string; name: string }[] => {
    if (field.range && field.range.length > 0) return field.range;
    const category = frameworkCategories.find((cat) => cat.code === field.code);
    if (category?.terms) {
      return category.terms.map((term) => ({ key: term.name, name: term.name }));
    }
    return [];
  };

  const handleFieldChange = (code: string, value: string | string[]) => {
    setFormValues((prev) => ({ ...prev, [code]: value }));
  };

  const handleMultiSelectToggle = (code: string, optionKey: string) => {
    setFormValues((prev) => {
      const current = (prev[code] as string[]) || [];
      const next = current.includes(optionKey)
        ? current.filter((v) => v !== optionKey)
        : [...current, optionKey];
      return { ...prev, [code]: next };
    });
  };

  const canSubmit = fields.every((field) => {
    if (!field.required) return true;
    const val = formValues[field.code];
    if (Array.isArray(val)) return val.length > 0;
    return typeof val === 'string' && val.trim().length > 0;
  });

  return {
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
  };
};