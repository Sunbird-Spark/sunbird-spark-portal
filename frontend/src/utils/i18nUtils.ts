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
