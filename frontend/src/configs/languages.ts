export type Direction = 'ltr' | 'rtl';

export interface LanguageConfig {
  code: 'en' | 'fr' | 'pt' | 'ar';
  label: string;
  dir: Direction;
  index: number;
}

export const LANGUAGES: readonly LanguageConfig[] = [
  { code: 'en', label: 'English', dir: 'ltr', index: 1 },
  { code: 'fr', label: 'Français', dir: 'ltr', index: 2 },
  { code: 'pt', label: 'Português', dir: 'ltr', index: 3 },
  { code: 'ar', label: 'العربية', dir: 'rtl', index: 4 },
] as const;

export type SupportedLanguage = (typeof LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const SORTED_LANGUAGES = [...LANGUAGES].sort((a, b) => a.index - b.index);

/**
 * Map for O(1) access by language code
 * ex: LANGUAGE_MAP.en => { code:'en', label:'English', dir:'ltr', index:1 }
 */
export const LANGUAGE_MAP = Object.fromEntries(
  LANGUAGES.map((lang) => [lang.code, lang])
) as Record<SupportedLanguage, LanguageConfig>;
