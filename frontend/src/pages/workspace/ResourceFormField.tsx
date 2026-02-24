import React from 'react';

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
}

interface ResourceFormFieldProps {
  field: FormField;
  value: string | string[];
  options: { key: string; name: string }[];
  isLoading: boolean;
  openDropdown: string | null;
  onFieldChange: (code: string, value: string | string[]) => void;
  onMultiSelectToggle: (code: string, optionKey: string) => void;
  onDropdownToggle: (code: string | null) => void;
  dropdownRef?: React.RefObject<HTMLDivElement>;
}

const inputClass = "w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-rubik focus:outline-none focus:ring-2 focus:ring-sunbird-wave/50 focus:border-sunbird-wave bg-white";

export default function ResourceFormField({
  field,
  value,
  options,
  isLoading,
  openDropdown,
  onFieldChange,
  onMultiSelectToggle,
  onDropdownToggle,
  dropdownRef,
}: ResourceFormFieldProps) {
  if (field.inputType === 'text' || field.inputType === 'number') {
    return (
      <div>
        <label className="block text-sm font-medium font-rubik text-foreground mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
          type={field.inputType === 'number' ? 'number' : 'text'}
          value={(value as string) || ''}
          onChange={(e) => onFieldChange(field.code, e.target.value)}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          className={inputClass}
          disabled={isLoading || !field.editable}
          autoFocus={field.code === 'name'}
        />
      </div>
    );
  }

  if (field.inputType === 'select') {
    return (
      <div>
        <label className="block text-sm font-medium font-rubik text-foreground mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <select
          value={(value as string) || ''}
          onChange={(e) => onFieldChange(field.code, e.target.value)}
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
    const selected = (value as string[]) || [];
    const isDropdownOpen = openDropdown === field.code;
    return (
      <div ref={isDropdownOpen ? dropdownRef : undefined} className="relative">
        <label className="block text-sm font-medium font-rubik text-foreground mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <button
          type="button"
          onClick={() => onDropdownToggle(isDropdownOpen ? null : field.code)}
          disabled={isLoading || !field.editable}
          className={`${inputClass} text-left flex items-center justify-between gap-2 min-h-[2.75rem]`}
        >
          <div className="flex-1 flex flex-wrap gap-1.5">
            {selected.length > 0 ? (
              selected.map((val) => (
                <span key={val} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sunbird-wave/10 text-sunbird-ink text-xs font-rubik">
                  {val}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); onMultiSelectToggle(field.code, val); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onMultiSelectToggle(field.code, val); } }}
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
          <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isDropdownOpen && options.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => onMultiSelectToggle(field.code, opt.key)}
                className={`w-full text-left px-4 py-2 text-sm font-rubik hover:bg-sunbird-wave/5 flex items-center gap-2 ${selected.includes(opt.key) ? 'bg-sunbird-wave/10 text-sunbird-ink' : 'text-foreground'}`}
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected.includes(opt.key) ? 'bg-sunbird-wave border-sunbird-wave text-white' : 'border-gray-300'}`}>
                  {selected.includes(opt.key) && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
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
}