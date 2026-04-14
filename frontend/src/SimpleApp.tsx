import React from 'react';
import { useAppI18n } from './hooks/useAppI18n';
import SimpleLanguageSwitcher from './components/common/SimpleLanguageSwitcher';

export default function SimpleApp(): React.JSX.Element {
  const { t, currentLanguage } = useAppI18n();

  return (
    <div>
      <header>
        <h1>{t('title')}</h1>
        <p>{t('subtitle')}</p>
        <SimpleLanguageSwitcher />
      </header>

      <main>
        <h2>🌐 {t('dashboard')}</h2>

        <div>
          <div>
            <span>Current Language: </span>
            <span>{currentLanguage.label}</span>
          </div>

          <div>
            <span>Welcome Message: </span>
            <span>{t('welcome')}</span>
          </div>

          <div>
            <span>Dashboard: </span>
            <span>{t('dashboard')}</span>
          </div>
        </div>

        <div>
          <button type="button" aria-label={t('save')}>
            {t('save')}
          </button>
          <button type="button" aria-label={t('cancel')}>
            {t('cancel')}
          </button>
        </div>
      </main>
    </div>
  );
}
