import React, { useEffect } from 'react';
import { useAppI18n } from '../hooks/useAppI18n';

export default function I18nDirectionProvider({ children }: { children: React.ReactNode }) {
  const { dir, currentCode } = useAppI18n();

useEffect(() => {
  document.documentElement.dir = dir;
  document.body.dir = dir;
  document.documentElement.lang = currentCode;
}, [dir, currentCode]);

  return <>{children}</>;
}
