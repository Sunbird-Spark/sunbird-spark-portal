import React from 'react';
import { FiArrowLeft } from 'react-icons/fi';

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
}) => (
  <div className="content-review-button-container">
    <button onClick={onBack} className="content-review-go-back">
      <FiArrowLeft /> Back
    </button>
    {isReviewMode && (
      <div className="content-review-actions">
        <button
          className="content-review-btn-publish"
          onClick={onPublish}
          disabled={isSubmitting || isLoadingPublishForm}
        >
          {isLoadingPublishForm ? 'Loading...' : isSubmitting && dialogMode === 'publish' ? 'Publishing...' : 'Publish'}
        </button>
        <button
          className="content-review-btn-reject"
          onClick={onRequestChanges}
          disabled={isSubmitting || isLoadingRequestChangesForm}
        >
          {isLoadingRequestChangesForm ? 'Loading...' : 'Request for Changes'}
        </button>
      </div>
    )}
  </div>
));

ReviewPageHeader.displayName = 'ReviewPageHeader';

export default ReviewPageHeader;
