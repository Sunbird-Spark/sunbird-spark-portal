import { useTranslation } from 'react-i18next';
import { DEFAULT_LANGUAGE, LANGUAGE_MAP, SORTED_LANGUAGES } from '../configs/languages.ts';

export type LanguageCode = keyof typeof LANGUAGE_MAP;

export function useAppI18n() {
  const { t, i18n } = useTranslation();

  const currentCode = (i18n.language || DEFAULT_LANGUAGE) as LanguageCode;

  const currentLanguage =
    LANGUAGE_MAP[currentCode] ?? LANGUAGE_MAP[DEFAULT_LANGUAGE];

  const changeLanguage = async (code: LanguageCode) => {
    if (!LANGUAGE_MAP[code]) return;
    await i18n.changeLanguage(code);
  };

  return {
    t,
    languages: SORTED_LANGUAGES,
    currentLanguage,
    currentCode: currentLanguage.code as LanguageCode,
    dir: currentLanguage.dir,
    isRTL: currentLanguage.dir === 'rtl',
    changeLanguage,
  };
}
