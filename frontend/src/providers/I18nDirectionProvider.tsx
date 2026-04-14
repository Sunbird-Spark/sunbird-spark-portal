import React, { useEffect } from 'react';
import { useAppI18n } from '../hooks/useAppI18n';

export default function I18nDirectionProvider({ children }: { children: React.ReactNode }) {
  const { dir, currentCode, currentLanguage } = useAppI18n();

  useEffect(() => {
    document.documentElement.dir = dir;
    document.body.dir = dir;
    document.documentElement.lang = currentCode;
    document.documentElement.style.setProperty('--app-font-family', currentLanguage.font);
  }, [dir, currentCode, currentLanguage.font]);

  return <>{children}</>;
}
