import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { mockLanguage, mockChangeLanguage } = vi.hoisted(() => ({
  mockLanguage: { value: 'en' },
  mockChangeLanguage: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: mockLanguage.value,
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

import { useAppI18n } from './useAppI18n';

describe('useAppI18n', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLanguage.value = 'en';
    mockChangeLanguage.mockResolvedValue(undefined);
  });

  it('returns English language config for "en"', () => {
    const { result } = renderHook(() => useAppI18n());
    expect(result.current.currentLanguage.code).toBe('en');
    expect(result.current.dir).toBe('ltr');
    expect(result.current.isRTL).toBe(false);
  });

  it('returns Arabic language config for "ar" with RTL direction', () => {
    mockLanguage.value = 'ar';
    const { result } = renderHook(() => useAppI18n());
    expect(result.current.currentLanguage.code).toBe('ar');
    expect(result.current.dir).toBe('rtl');
    expect(result.current.isRTL).toBe(true);
  });

  it('falls back to DEFAULT_LANGUAGE when code is unknown (line 12 ?? branch)', () => {
    mockLanguage.value = 'xx';
    const { result } = renderHook(() => useAppI18n());
    // 'xx' not in LANGUAGE_MAP → falls back to DEFAULT_LANGUAGE ('en')
    expect(result.current.currentLanguage.code).toBe('en');
  });

  it('calls i18n.changeLanguage and localStorage.setItem for known code', async () => {
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => undefined);
    const { result } = renderHook(() => useAppI18n());

    await act(async () => {
      await result.current.changeLanguage('fr');
    });

    expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
    expect(setItemSpy).toHaveBeenCalledWith('app-language', 'fr');
    setItemSpy.mockRestore();
  });

  it('does NOT call i18n.changeLanguage for unknown code (line 15 early return)', async () => {
    const { result } = renderHook(() => useAppI18n());

    await act(async () => {
      await result.current.changeLanguage('xx' as any);
    });

    expect(mockChangeLanguage).not.toHaveBeenCalled();
  });

  it('swallows localStorage errors gracefully (line 19 catch block)', async () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => { throw new Error('full'); });
    const { result } = renderHook(() => useAppI18n());

    await expect(act(async () => {
      await result.current.changeLanguage('fr');
    })).resolves.not.toThrow();
  });

  it('returns SORTED_LANGUAGES array', () => {
    const { result } = renderHook(() => useAppI18n());
    expect(Array.isArray(result.current.languages)).toBe(true);
    expect(result.current.languages.length).toBeGreaterThan(0);
  });
});
