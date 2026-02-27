import React from 'react';
import { useAppI18n } from '@/hooks/useAppI18n';

const ReportsPage: React.FC = () => {
  const { t } = useAppI18n();
  return (
    <div>
      <div>
        <h1>{t('reports.title')}</h1>
      </div>

      <div>
        <h2>{t('reports.contentReports')}</h2>
        <p>{t('content.accessRestricted')}<strong>{t('reports.roleContentReviewer')}</strong>{t('content.roleSuffix')}</p>
        <ul>
          <li>{t('reports.analytics')}</li>
          <li>{t('reports.submissionStats')}</li>
          <li>{t('reports.qaMetrics')}</li>
          <li>{t('reports.performance')}</li>
        </ul>
      </div>
    </div>
  );
};

export default ReportsPage;
