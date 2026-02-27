import React from 'react';
import { Trans } from 'react-i18next';
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
        <p>
          <Trans
            i18nKey="reports.accessInfo"
            values={{ role: t('reports.roleContentReviewer') }}
            components={{ 1: <strong /> }}
          />
        </p>
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
