import React from 'react';
import './PublishWarningDialog.css';

interface PublishWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

const PublishWarningDialog: React.FC<PublishWarningDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="publish-warning-overlay">
      <div className="publish-warning-dialog">
        <div className="publish-warning-header">
          <h2 className="publish-warning-title">Confirm Publish</h2>
        </div>
        <div className="publish-warning-content">
          <p className="publish-warning-text">
            You have given some review comments/suggestions, they will be lost if content is published.
          </p>
          <p className="publish-warning-question">Do you want to publish?</p>
        </div>
        <div className="publish-warning-actions">
          <button
            className="publish-warning-btn publish-warning-btn-no"
            onClick={onClose}
            disabled={isLoading}
          >
            No
          </button>
          <button
            className="publish-warning-btn publish-warning-btn-yes"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Yes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishWarningDialog;
