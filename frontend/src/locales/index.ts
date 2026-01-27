/**
 * I18n exports for the application
 * This file provides convenient access to i18n utilities
 */

// Re-export the main i18n configuration
export {
  type SupportedLanguage,
  LANGUAGES as SUPPORTED_LANGUAGES,
} from '../configs/languages';

// Re-export hooks (simple version only)
export { useAppI18n } from '../hooks/useAppI18n';

// Re-export components (simple version only)
export { default as SimpleLanguageSwitcher } from '../components/SimpleLanguageSwitcher';