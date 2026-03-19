import React from 'react';
import { useAppI18n } from '@/hooks/useAppI18n';

interface CertHintProps {
  hintOpen: boolean;
  setHintOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CertHint: React.FC<CertHintProps> = ({ hintOpen, setHintOpen }) => {
  const { t } = useAppI18n();

  return (
    <>
      <button
        type="button"
        className="text-xs text-muted-foreground underline decoration-dotted mb-5 hover:opacity-80"
        onClick={() => setHintOpen((o) => !o)}
        data-testid="hint-toggle"
      >
        {hintOpen ? '▲' : '▼'} {t('certificatesTab.whatIsSunbirdId')}
      </button>

      {hintOpen && (
        <div className="bg-accent border border-border rounded-lg p-4 mb-6 text-sm max-w-md text-foreground" data-testid="hint-box">
          <strong>{t('certificatesTab.howToFindSunbirdId')}</strong>
          <ol className="mt-1.5 ml-5 list-decimal">
            <li dangerouslySetInnerHTML={{ __html: t('certificatesTab.clickProfileTab') }} />
            <li>{t('certificatesTab.sunbirdIdDisplayed')}</li>
          </ol>
        </div>
      )}
    </>
  );
};
