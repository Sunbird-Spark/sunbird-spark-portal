import React from 'react';
import { useAppI18n } from '@/hooks/useAppI18n';

const CreateContentPage: React.FC = () => {
  const { t } = useAppI18n();
  return (
    <div>
      <div>
        <h1>{t('createContent')}</h1>
      </div>

      <div>
        <h2>{t('content.creationTools')}</h2>
        <p>{t('content.accessRestricted')}<strong>{t('content.roleContentCreator')}</strong>{t('content.roleSuffix')}</p>
        <ul>
          <li>{t('content.createArticles')}</li>
          <li>{t('content.uploadMedia')}</li>
          <li>{t('content.draftContent')}</li>
          <li>{t('submitForReview')}</li>
        </ul>
      </div>
    </div>
  );
};

export default CreateContentPage;
