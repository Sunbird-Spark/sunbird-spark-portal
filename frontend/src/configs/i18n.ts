import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import fr from '../locales/fr.json';
import pt from '../locales/pt.json';
import ar from '../locales/ar.json';

import { DEFAULT_LANGUAGE } from './languages';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    pt: { translation: pt },
    ar: { translation: ar },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
  debug: import.meta.env.DEV,
 
});

export default i18n;
