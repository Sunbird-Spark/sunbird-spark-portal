import { describe, it, expect, vi } from 'vitest';
import { applyLanguageFromUrl } from './languageFromUrl';
import { LANGUAGE_STORAGE_KEY } from '@/configs/languages';
import i18n from '@/configs/i18n';

vi.mock('@/configs/i18n', () => ({
  default: { changeLanguage: vi.fn().mockResolvedValue(undefined) },
}));

describe('applyLanguageFromUrl', () => {
  it('persists and activates a catalog language from ?lang=', () => {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    applyLanguageFromUrl('?lang=fr');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('fr');
    expect(i18n.changeLanguage).toHaveBeenCalledWith('fr');
  });

  it('ignores values that are not in the language catalog', () => {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    vi.mocked(i18n.changeLanguage).mockClear();
    applyLanguageFromUrl('?lang=zz');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
    expect(i18n.changeLanguage).not.toHaveBeenCalled();
  });

  it('still changes language when storage writes fail', () => {
    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    vi.mocked(i18n.changeLanguage).mockClear();
    applyLanguageFromUrl('?lang=ar');
    expect(i18n.changeLanguage).toHaveBeenCalledWith('ar');
    setItem.mockRestore();
  });
});
