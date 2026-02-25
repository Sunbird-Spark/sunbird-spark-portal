import React from 'react';
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
        <p>{t('admin.accessRestricted')}<strong>{t('admin.roleAdmin')}</strong>{t('admin.roleSuffix')}</p>
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
