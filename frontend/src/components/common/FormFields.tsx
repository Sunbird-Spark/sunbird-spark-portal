import React from 'react';
import { useAppI18n } from '@/hooks/useAppI18n';
import './FormFields.css';

interface FormField {
  code: string;
  name: string;
  label: string;
  description: string;
  renderingHints?: {
    semanticColumnWidth?: string;
  };
  inputType: string;
  required: boolean;
  editable: boolean;
  visible: boolean;
  placeholder: string;
  index: number;
  range?: { key: string; name: string }[];
}

interface FormFieldProps {
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

const getColumnClass = (width?: string): string => {
  switch (width) {
    case 'four': return 'content-field-col-four';
    case 'six': return 'content-field-col-six';
    default: return 'content-field-col-twelve';
  }
};

export default function ContentFormField({
  field,
  value,
  options,
  isLoading,
  openDropdown,
  onFieldChange,
  onMultiSelectToggle,
  onDropdownToggle,
  dropdownRef,
}: FormFieldProps) {
  const { t } = useAppI18n();
  const colClass = getColumnClass(field.renderingHints?.semanticColumnWidth);

  if (field.inputType === 'text' || field.inputType === 'number') {
    return (
      <div className={colClass}>
        <div className="content-field-container">
          <label className="content-field-label">
            {field.label}
            {field.required && <span className="content-field-required">*</span>}
          </label>
          <input
            type={field.inputType === 'number' ? 'number' : 'text'}
            value={(value as string) || ''}
            onChange={(e) => onFieldChange(field.code, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className="content-field-input"
            disabled={isLoading || !field.editable}
            autoFocus={field.code === 'name'}
          />
        </div>
      </div>
    );
  }

  if (field.inputType === 'select') {
    return (
      <div className={colClass}>
        <div className="content-field-container">
          <label className="content-field-label">
            {field.label}
            {field.required && <span className="content-field-required">*</span>}
          </label>
          <select
            value={(value as string) || ''}
            onChange={(e) => onFieldChange(field.code, e.target.value)}
            className="content-field-input"
            disabled={isLoading || !field.editable}
          >
            <option value="" disabled>{t('formFields.select', { field: field.label.toLowerCase() })}</option>
            {options.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.name}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  if (field.inputType === 'multiSelect') {
    const selected = (value as string[]) || [];
    const isDropdownOpen = openDropdown === field.code;
    return (
      <div className={colClass}>
        <div ref={isDropdownOpen ? dropdownRef : undefined} className="content-field-container">
          <label className="content-field-label">
            {field.label}
            {field.required && <span className="content-field-required">*</span>}
          </label>
          <button
            type="button"
            onClick={() => onDropdownToggle(isDropdownOpen ? null : field.code)}
            disabled={isLoading || !field.editable}
            className="content-field-input content-field-multiselect-button"
          >
            <div className="content-field-multiselect-values">
              {selected.length > 0 ? (
                selected.map((val) => (
                  <span key={val} className="content-field-multiselect-tag">
                    {val}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); onMultiSelectToggle(field.code, val); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onMultiSelectToggle(field.code, val); } }}
                      className="content-field-multiselect-tag-remove"
                    >
                      &times;
                    </span>
                  </span>
                ))
              ) : (
                <span className="content-field-multiselect-placeholder">{t('formFields.select', { field: field.label.toLowerCase() })}</span>
              )}
            </div>
            <svg className={`content-field-multiselect-icon ${isDropdownOpen ? 'open' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isDropdownOpen && options.length > 0 && (
            <div className="content-field-dropdown">
              {options.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onMultiSelectToggle(field.code, opt.key)}
                  className={`content-field-dropdown-option ${selected.includes(opt.key) ? 'selected' : ''}`}
                >
                  <span className={`content-field-checkbox ${selected.includes(opt.key) ? 'checked' : ''}`}>
                    {selected.includes(opt.key) && (
                      <svg className="content-field-checkbox-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      </div>
    );
  }

  return null;
}