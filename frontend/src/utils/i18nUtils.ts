/**
 * Resolves a multilingual title/label to a plain string for the given language code.
 * Accepts both a legacy plain string and the object format {"en":"...", "ar":"...", ...}.
 */
export function resolveTitleText(
  title: string | Record<string, string> | undefined,
  langCode: string
): string {
  if (!title) return '';
  if (typeof title === 'object') {
    return title[langCode] || title['en'] || Object.values(title)[0] || '';
  }
  return title;
}

/**
 * Resolves a multilingual title/label and applies i18n translation if needed.
 * Handles both API-driven multilingual objects and i18n translation keys.
 * 
 * @param title - The title to resolve (object, string, or undefined)
 * @param langCode - Current language code
 * @param t - Translation function from i18n
 * @returns Resolved and translated string
 */
export function resolveTitleTextWithTranslation(
  title: string | Record<string, string> | undefined,
  langCode: string,
  t: (key: string, options?: { defaultValue?: string }) => string
): string {
  if (!title) return '';
  
  // If title is an object with language codes, resolve it
  if (typeof title === 'object') {
    return title[langCode] || title['en'] || Object.values(title)[0] || '';
  }
  
  // If title is a string, try to translate it (handles i18n keys)
  // If no translation exists, return the original string
  return t(title, { defaultValue: title });
}

/**
 * Normalizes a category name to a translation key format.
 * Converts "Course" -> "course", "Digital Textbook" -> "digitaltextbook"
 * 
 * @param category - The category name to normalize
 * @returns Normalized key for translation lookup
 */
export function normalizeCategoryKey(category: string): string {
  return category.toLowerCase().replace(/\s+/g, '');
}

/**
 * Gets a translated category label with fallback to original value.
 * Shared utility to avoid duplication across components.
 * 
 * @param category - The category name (e.g., "Course", "Digital Textbook")
 * @param t - Translation function from i18n
 * @param fallback - Optional fallback value if category is undefined
 * @returns Translated category label
 */
export function getCategoryLabel(
  category: string | undefined,
  t: (key: string, options?: { defaultValue?: string }) => string,
  fallback?: string
): string {
  if (!category) return fallback || '';
  const key = normalizeCategoryKey(category);
  return t(`contentTypes.${key}`, { defaultValue: category });
}
