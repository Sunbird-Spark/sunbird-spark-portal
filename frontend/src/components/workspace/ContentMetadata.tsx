import React from 'react';

interface ContentMetadataProps {
  name?: string;
  description?: string;
  creator?: string;
  lastUpdatedOn?: string;
  primaryCategory?: string;
  contentType?: string;
  createdOn?: string;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const ContentMetadata: React.FC<ContentMetadataProps> = React.memo(({
  name,
  description,
  creator,
  lastUpdatedOn,
  primaryCategory,
  contentType,
  createdOn,
}) => (
  <div className="content-review-details-section">
    {description && (
      <p className="content-review-description">{description}</p>
    )}
    <div className="content-review-metadata-grid">
      <div>
        <span className="label">Created By</span>
        <span className="value">{creator || 'Unknown'}</span>
      </div>
      <div>
        <span className="label">Last Updated</span>
        <span className="value">{formatDate(lastUpdatedOn)}</span>
      </div>
      <div>
        <span className="label">Content Type</span>
        <span className="value">{primaryCategory || contentType || 'N/A'}</span>
      </div>
      <div>
        <span className="label">Created On</span>
        <span className="value">{formatDate(createdOn)}</span>
      </div>
    </div>
  </div>
));

ContentMetadata.displayName = 'ContentMetadata';

export default ContentMetadata;
