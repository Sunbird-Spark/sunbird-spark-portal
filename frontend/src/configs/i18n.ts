import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import fr from '../locales/fr.json';
import pt from '../locales/pt.json';
import ar from '../locales/ar.json';

import { DEFAULT_LANGUAGE, LANGUAGE_MAP, LANGUAGE_STORAGE_KEY, SupportedLanguage } from './languages';

function getInitialLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && LANGUAGE_MAP[saved as SupportedLanguage]) {
      return saved as SupportedLanguage;
    }
  } catch {
    // localStorage unavailable (e.g. SSR or private-browsing restrictions)
  }
  return DEFAULT_LANGUAGE;
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    pt: { translation: pt },
    ar: { translation: ar },
  },
  lng: getInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
  debug: import.meta.env.DEV,
});

export default i18n;
