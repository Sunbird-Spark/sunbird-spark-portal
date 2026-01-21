/**
 * I18n exports for the application
 * This file provides convenient access to i18n utilities
 */

// Re-export types and utilities from languages config
export {
  LANGUAGES as SUPPORTED_LANGUAGES,
  LANGUAGES as supportedLanguages,
  type SupportedLanguage,
  LANGUAGE_MAP as LANGUAGE_LABELS
} from '../configs/languages';

// Re-export hooks (simple version only)
export { useAppI18n } from '../hooks/useAppI18n';

// Re-export components (simple version only)
export { default as SimpleLanguageSwitcher } from '../components/SimpleLanguageSwitcher';
