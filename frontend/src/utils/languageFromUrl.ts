import i18n from '@/configs/i18n';
import { LANGUAGES, LANGUAGE_STORAGE_KEY } from '@/configs/languages';

/**
 * Applies the `?lang=` URL parameter: persists and activates it only when it
 * matches the language catalog, so the raw URL value never reaches browser
 * storage or i18n.
 */
export function applyLanguageFromUrl(search: string = window.location.search): void {
  const langParam = new URLSearchParams(search).get('lang');
  const lang = LANGUAGES.find((l) => l.code === langParam)?.code;
  if (!lang) return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    /* storage unavailable */
  }
  void i18n.changeLanguage(lang).catch((err) => {
    console.error('Failed to change language to', lang, err);
  });
}
