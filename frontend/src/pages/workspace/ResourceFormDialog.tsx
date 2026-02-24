import { type FormEvent, useCallback, useEffect, useState, useRef } from "react";
import { Button } from "@/components/common/Button";
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

export interface ResourceFormData {
  /** Content name (always present) */
  name: string;
  /** Content description */
  description: string;
  /** All other dynamic fields from the form read API, keyed by field code */
  dynamicFields: Record<string, string | string[] | number>;
}

interface ResourceFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ResourceFormData) => void;
  isLoading?: boolean;
  orgChannelId: string;
  orgFramework: string;
  /** Form read subType — "resource" for Story, "assessment" for Quiz */
  formSubType?: string;
  /** Dialog title shown at the top */
  title?: string;
}

const formService = new FormService();
const frameworkService = new FrameworkService();

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
  const [fields, setFields] = useState<FormField[]>([]);
  const [frameworkCategories, setFrameworkCategories] = useState<FrameworkCategory[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string | string[]>>({});
  const [isFetchingForm, setIsFetchingForm] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

      // Initialize default values
      const defaults: Record<string, string | string[]> = {};
      for (const field of sortedFields) {
        if (field.inputType === 'multiSelect') {
          defaults[field.code] = [];
        } else {
          defaults[field.code] = '';
        }
      }
      setFormValues(defaults);

      // Fetch framework for category-based options
      if (orgFramework) {
        try {
          const fwResponse = await frameworkService.read<{ framework: { categories?: FrameworkCategory[] } }>(orgFramework);
          const categories = fwResponse?.data?.framework?.categories ?? [];
          setFrameworkCategories(categories);
        } catch (fwErr) {
          console.warn('Failed to fetch framework, fields without range will have no options:', fwErr);
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
    if (!open) {
      resetState();
    }
  }, [open, fetchFormAndFramework, resetState]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isLoading, onClose]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e: Event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  if (!open) return null;

  const getOptionsForField = (field: FormField): { key: string; name: string }[] => {
    // 1. Check range first
    if (field.range && field.range.length > 0) {
      return field.range;
    }
    // 2. Match code with framework categories
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

  // Only required fields block submission
  const canSubmit = fields.every((field) => {
    if (!field.required) return true;
    const val = formValues[field.code];
    if (Array.isArray(val)) return val.length > 0;
    return typeof val === 'string' && val.trim().length > 0;
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

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

    onSubmit({
      name: nameValue,
      description: ((formValues['description'] as string) || 'Enter description for Resource').trim(),
      dynamicFields,
    });
  };

  const inputClass = "w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-rubik focus:outline-none focus:ring-2 focus:ring-sunbird-wave/50 focus:border-sunbird-wave bg-white";

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
        <h2 className="text-xl font-bold font-rubik text-foreground mb-2">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground mb-4 font-rubik">
          Fill in the details to create your content
        </p>

        {isFetchingForm && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-3 border-sunbird-wave/30 border-t-sunbird-wave rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-rubik">Loading form...</p>
          </div>
        )}

        {fetchError && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <p className="text-sm text-red-600 font-rubik">{fetchError}</p>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                fetchAttempted.current = false;
                fetchFormAndFramework();
              }}
              className="bg-sunbird-brick hover:bg-sunbird-brick/90 text-white"
            >
              Retry
            </Button>
          </div>
        )}

        {!isFetchingForm && !fetchError && fields.length > 0 && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {fields.map((field) => {
                if (field.inputType === 'text' || field.inputType === 'number') {
                  return (
                    <div key={field.code}>
                      <label className="block text-sm font-medium font-rubik text-foreground mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-0.5">*</span>}
                      </label>
                      <input
                        type={field.inputType === 'number' ? 'number' : 'text'}
                        value={(formValues[field.code] as string) || ''}
                        onChange={(e) => handleFieldChange(field.code, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        className={inputClass}
                        disabled={isLoading || !field.editable}
                        autoFocus={field.code === 'name'}
                      />
                    </div>
                  );
                }

                if (field.inputType === 'select') {
                  const options = getOptionsForField(field);
                  return (
                    <div key={field.code}>
                      <label className="block text-sm font-medium font-rubik text-foreground mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-0.5">*</span>}
                      </label>
                      <select
                        value={(formValues[field.code] as string) || ''}
                        onChange={(e) => handleFieldChange(field.code, e.target.value)}
                        className={inputClass}
                        disabled={isLoading || !field.editable}
                      >
                        <option value="" disabled>Select {field.label.toLowerCase()}</option>
                        {options.map((opt) => (
                          <option key={opt.key} value={opt.key}>{opt.name}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (field.inputType === 'multiSelect') {
                  const options = getOptionsForField(field);
                  const selected = (formValues[field.code] as string[]) || [];
                  const isDropdownOpen = openDropdown === field.code;
                  return (
                    <div key={field.code} ref={isDropdownOpen ? dropdownRef : undefined} className="relative">
                      <label className="block text-sm font-medium font-rubik text-foreground mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-0.5">*</span>}
                      </label>
                      <button
                        type="button"
                        onClick={() => setOpenDropdown(isDropdownOpen ? null : field.code)}
                        disabled={isLoading || !field.editable}
                        className={`${inputClass} text-left flex items-center justify-between gap-2 min-h-[2.75rem]`}
                      >
                        <div className="flex-1 flex flex-wrap gap-1.5">
                          {selected.length > 0 ? (
                            selected.map((val) => (
                              <span
                                key={val}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sunbird-wave/10 text-sunbird-ink text-xs font-rubik"
                              >
                                {val}
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => { e.stopPropagation(); handleMultiSelectToggle(field.code, val); }}
                                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleMultiSelectToggle(field.code, val); } }}
                                  className="hover:text-red-500 text-xs leading-none cursor-pointer"
                                >
                                  &times;
                                </span>
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">Select {field.label.toLowerCase()}</span>
                          )}
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      {isDropdownOpen && options.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {options.map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => handleMultiSelectToggle(field.code, opt.key)}
                              className={`w-full text-left px-4 py-2 text-sm font-rubik hover:bg-sunbird-wave/5 flex items-center gap-2 ${selected.includes(opt.key) ? 'bg-sunbird-wave/10 text-sunbird-ink' : 'text-foreground'}`}
                            >
                              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected.includes(opt.key) ? 'bg-sunbird-wave border-sunbird-wave text-white' : 'border-gray-300'}`}>
                                {selected.includes(opt.key) && (
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                )}
                              </span>
                              {opt.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return null;
              })}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
              >
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
        )}
      </div>
    </div>
  );
}
