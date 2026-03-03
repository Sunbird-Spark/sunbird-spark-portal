import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';

interface ReviewPageHeaderProps {
  onBack: () => void;
  isReviewMode: boolean;
  onPublish: () => void;
  onRequestChanges: () => void;
  isSubmitting: boolean;
  isLoadingPublishForm: boolean;
  isLoadingRequestChangesForm: boolean;
  dialogMode: 'publish' | 'request-changes' | null;
}

const ReviewPageHeader: React.FC<ReviewPageHeaderProps> = React.memo(({
  onBack,
  isReviewMode,
  onPublish,
  onRequestChanges,
  isSubmitting,
  isLoadingPublishForm,
  isLoadingRequestChangesForm,
  dialogMode,
}) => {
  const { t } = useAppI18n();

  return (
    <div className="content-review-button-container">
      <button onClick={onBack} className="content-review-go-back">
        <FiArrowLeft /> {t('back')}
      </button>
      {isReviewMode && (
        <div className="content-review-actions">
          <button
            className="content-review-btn-publish"
            onClick={onPublish}
            disabled={isSubmitting || isLoadingPublishForm}
          >
            {isLoadingPublishForm ? t('loading') : isSubmitting && dialogMode === 'publish' ? t('checklistDialog.publishing') : t('checklistDialog.publish')}
          </button>
          <button
            className="content-review-btn-reject"
            onClick={onRequestChanges}
            disabled={isSubmitting || isLoadingRequestChangesForm}
          >
            {isLoadingRequestChangesForm ? t('loading') : t('checklistDialog.requestForChanges')}
          </button>
        </div>
      )}
    </div>
  );
});

ReviewPageHeader.displayName = 'ReviewPageHeader';

export default ReviewPageHeader;
