import React from 'react';
import { useState, useEffect } from 'react';
import { CheckListFormField, CheckListFormFieldContent } from '@/types/formTypes';
import './ChecklistDialog.css';

interface ChecklistDialogProps {
  // Common props
  isOpen: boolean;
  onClose: () => void;
  formFields: CheckListFormField[];
  isLoading: boolean;
  
  // Mode configuration
  mode: 'publish' | 'request-changes';
  
  // Mode-specific callbacks
  onPublish?: () => void;
  onRequestChanges?: (rejectReasons: string[], rejectComment: string) => void;
}

const ChecklistDialog: React.FC<ChecklistDialogProps> = ({
  isOpen,
  onClose,
  formFields,
  isLoading,
  mode,
  onPublish,
  onRequestChanges,
}) => {
  // State management
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [otherReasonChecked, setOtherReasonChecked] = useState(false);
  const [otherReasonText, setOtherReasonText] = useState('');

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCheckedItems({});
      setOtherReasonChecked(false);
      setOtherReasonText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Checkbox key generation: ${fieldIndex}-${contentIndex}-${itemIndex}
  const handleCheckboxChange = (key: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Validation helper functions
  const getTotalCheckboxes = () => {
    let total = 0;
    formFields.forEach((field) => {
      field.contents?.forEach((content: CheckListFormFieldContent) => {
        total += content.checkList.length;
      });
    });
    return total;
  };

  const getCheckedCount = () => {
    return Object.values(checkedItems).filter(Boolean).length;
  };

  // Mode-specific validation
  const isValid = () => {
    if (mode === 'publish') {
      return getCheckedCount() === getTotalCheckboxes();
    }

    // request-changes mode: require at least one reason selected
    const hasAtLeastOneReason = getCheckedCount() > 0 || otherReasonChecked;
    const hasOtherReasonText = !otherReasonChecked || otherReasonText.trim().length > 0;
    return hasAtLeastOneReason && hasOtherReasonText;
  };

  // Collect selected checklist items as reject reasons for the API
  const getSelectedReasons = (): string[] => {
    const reasons: string[] = [];

    formFields.forEach((field, fieldIndex) => {
      field.contents?.forEach((content: CheckListFormFieldContent, contentIndex: number) => {
        content.checkList.forEach((item: string, itemIndex: number) => {
          const checkboxKey = `${fieldIndex}-${contentIndex}-${itemIndex}`;
          if (checkedItems[checkboxKey]) {
            reasons.push(item);
          }
        });
      });
    });

    if (otherReasonChecked) {
      reasons.push('Others');
    }

    return reasons;
  };

  // Build the reject comment text from "Other Reason" textarea
  const getRejectComment = (): string => {
    if (otherReasonChecked && otherReasonText.trim()) {
      return otherReasonText.trim();
    }
    return '';
  };

  // Action handlers
  const handlePrimaryAction = () => {
    if (mode === 'publish' && onPublish) {
      onPublish();
    } else if (mode === 'request-changes' && onRequestChanges) {
      const reasons = getSelectedReasons();
      const comment = getRejectComment();
      onRequestChanges(reasons, comment);
    }
  };

  // Mode-specific configuration
  const dialogTitle = mode === 'publish' ? 'Publish Content' : 'Request for Changes';
  const primaryButtonLabel = mode === 'publish' 
    ? (isLoading ? 'Publishing...' : 'Publish')
    : (isLoading ? 'Submitting...' : 'Request for Changes');

  // Check if any field has otherReason for request-changes mode
  const hasOtherReasonField = mode === 'request-changes' && 
    formFields.some(field => field.otherReason !== undefined);

  return (
    <div className="review-dialog-overlay">
      <div className="review-dialog">
        <h2 className="review-dialog-main-title">{dialogTitle}</h2>
        
        {formFields.map((field, fieldIndex) => (
          <div key={fieldIndex}>
            <p className="review-dialog-subtitle-text">{field.title}</p>
            
            {/* Horizontal sections container */}
            <div className="review-dialog-sections-container">
              {field.contents?.map((content: { name: string; checkList: string[] }, contentIndex: number) => (
                <div key={contentIndex} className="review-dialog-section-column">
                  <h4 className="review-dialog-section-title">{content.name}</h4>
                  {content.checkList.map((item: string, itemIndex: number) => {
                    const checkboxKey = `${fieldIndex}-${contentIndex}-${itemIndex}`;
                    return (
                      <label key={itemIndex} className="review-dialog-checkbox-label">
                        <input
                          type="checkbox"
                          checked={checkedItems[checkboxKey] || false}
                          onChange={() => handleCheckboxChange(checkboxKey)}
                          disabled={isLoading}
                          className="review-dialog-checkbox"
                        />
                        <span>{item}</span>
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Other reason field for request-changes mode */}
        {hasOtherReasonField && (
          <div className="review-dialog-other-reason">
            <label className="review-dialog-checkbox-label">
              <input
                type="checkbox"
                checked={otherReasonChecked}
                onChange={(e) => {
                  setOtherReasonChecked(e.target.checked);
                  if (!e.target.checked) {
                    setOtherReasonText('');
                  }
                }}
                disabled={isLoading}
                className="review-dialog-checkbox"
              />
              <span>Other Reason</span>
            </label>
            {otherReasonChecked && (
              <textarea
                value={otherReasonText}
                onChange={(e) => setOtherReasonText(e.target.value)}
                disabled={isLoading}
                placeholder="Please provide details..."
                className="review-dialog-textarea"
              />
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="review-dialog-actions">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="review-dialog-btn-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handlePrimaryAction}
            disabled={!isValid() || isLoading}
            className="review-dialog-btn-primary"
          >
            {primaryButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistDialog;
