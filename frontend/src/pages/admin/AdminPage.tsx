import React from 'react';
import { Trans } from 'react-i18next';
import { useAppI18n } from '@/hooks/useAppI18n';

const AdminPage: React.FC = () => {
  const { t } = useAppI18n();
  return (
    <div>
      <div>
        <h1>{t('admin.dashboard')}</h1>
      </div>

      <div>
        <h2>{t('admin.controls')}</h2>
        <p>
          <Trans
            i18nKey="admin.accessInfo"
            values={{ role: t('admin.roleAdmin') }}
            components={{ 1: <strong /> }}
          />
        </p>
        <ul>
          <li>{t('admin.manageUsers')}</li>
          <li>{t('admin.systemConfig')}</li>
          <li>{t('admin.viewReports')}</li>
          <li>{t('admin.accessControl')}</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminPage;
