import React from 'react';
import { useAppI18n } from '@/hooks/useAppI18n';
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
  const { t } = useAppI18n();

  if (!isOpen) return null;

  return (
    <div className="publish-warning-overlay">
      <div className="publish-warning-dialog">
        <div className="publish-warning-header">
          <h2 className="publish-warning-title">{t('workspace.review.confirmPublish')}</h2>
        </div>
        <div className="publish-warning-content">
          <p className="publish-warning-text">
            {t('workspace.review.publishWarningText')}
          </p>
          <p className="publish-warning-question">{t('workspace.review.publishWarningQuestion')}</p>
        </div>
        <div className="publish-warning-actions">
          <button
            className="publish-warning-btn publish-warning-btn-no"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('no')}
          </button>
          <button
            className="publish-warning-btn publish-warning-btn-yes"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? t('workspace.review.processing') : t('yes')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishWarningDialog;
