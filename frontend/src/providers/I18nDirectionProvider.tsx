import React, { useEffect } from 'react';
import { useAppI18n } from '../hooks/useAppI18n';

/**
 * Owns `<html>` `dir` and `lang` attributes only. The active font is owned
 * by `ThemeProvider`, which watches both the user-picked font and the
 * language (script-locked languages force their own font).
 */
export default function I18nDirectionProvider({ children }: { children: React.ReactNode }) {
  const { dir, currentCode } = useAppI18n();

  useEffect(() => {
    document.documentElement.dir = dir;
    document.body.dir = dir;
    document.documentElement.lang = currentCode;
  }, [dir, currentCode]);

  return <>{children}</>;
}
