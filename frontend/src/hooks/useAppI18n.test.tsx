import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import '@testing-library/jest-dom';

import { useAppI18n } from './useAppI18n';
import i18n from '../configs/i18n';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('useAppI18n Hook', () => {
  beforeEach(async () => {
    // Reset to English before each test
    await i18n.changeLanguage('en');
  });

  it('should expose a translation function', () => {
    const { result } = renderHook(() => useAppI18n(), { wrapper });

    expect(result.current.t).toBeDefined();
    expect(typeof result.current.t).toBe('function');

    // Stable assertion: should not return key for known translation
    const translated = result.current.t('title');
    expect(translated).toBeDefined();
    expect(translated).not.toBe('title');
  });

  it('should return English as default language', () => {
    const { result } = renderHook(() => useAppI18n(), { wrapper });

    expect(result.current.currentCode).toBe('en');
    expect(result.current.currentLanguage.code).toBe('en');
    expect(result.current.currentLanguage.label).toBe('English');
    expect(result.current.dir).toBe('ltr');
    expect(result.current.isRTL).toBe(false);
  });

  it('should return RTL direction for Arabic', async () => {
    await i18n.changeLanguage('ar');

    const { result } = renderHook(() => useAppI18n(), { wrapper });

    expect(result.current.currentCode).toBe('ar');
    expect(result.current.currentLanguage.code).toBe('ar');
    expect(result.current.dir).toBe('rtl');
    expect(result.current.isRTL).toBe(true);
  });

  it('should return LTR direction for Portuguese', async () => {
    await i18n.changeLanguage('pt');

    const { result } = renderHook(() => useAppI18n(), { wrapper });

    expect(result.current.currentCode).toBe('pt');
    expect(result.current.currentLanguage.code).toBe('pt');
    expect(result.current.dir).toBe('ltr');
    expect(result.current.isRTL).toBe(false);
  });

  it('should return all available languages (sorted config list)', () => {
    const { result } = renderHook(() => useAppI18n(), { wrapper });

    expect(result.current.languages).toBeDefined();
    expect(Array.isArray(result.current.languages)).toBe(true);
    expect(result.current.languages.length).toBeGreaterThan(0);

    // Contains English
    expect(result.current.languages).toContainEqual(
      expect.objectContaining({ code: 'en', label: 'English' })
    );

    // Contains Arabic
    expect(result.current.languages).toContainEqual(
      expect.objectContaining({ code: 'ar', label: 'العربية' })
    );
  });

  it('should change language successfully', async () => {
    const { result, rerender } = renderHook(() => useAppI18n(), { wrapper });

    expect(result.current.currentCode).toBe('en');

    await result.current.changeLanguage('fr');

    // Wait for i18next to update
    await waitFor(() => {
      expect(i18n.language).toBe('fr');
    });

    // Rerender hook to reflect updated i18n state
    rerender();

    expect(result.current.currentCode).toBe('fr');
    expect(result.current.currentLanguage.code).toBe('fr');
    expect(result.current.currentLanguage.label).toBe('Français');
    expect(result.current.dir).toBe('ltr');
  });

  it('should not change language for invalid language code', async () => {
    const { result, rerender } = renderHook(() => useAppI18n(), { wrapper });

    expect(result.current.currentCode).toBe('en');

    await result.current.changeLanguage('invalid' as any);

    // i18n should remain unchanged
    await waitFor(() => {
      expect(i18n.language).toBe('en');
    });

    rerender();
    expect(result.current.currentCode).toBe('en');
  });

  it('should always return a valid currentLanguage config (fallback behavior)', () => {
    const { result } = renderHook(() => useAppI18n(), { wrapper });

    expect(result.current.currentLanguage).toBeDefined();
    expect(result.current.currentLanguage.code).toBeDefined();
    expect(result.current.currentLanguage.label).toBeDefined();
    expect(['ltr', 'rtl']).toContain(result.current.currentLanguage.dir);
  });

  it('should fallback when i18n.language is empty string', () => {
    renderHook(() => useAppI18n(), { wrapper });

    // simulate empty i18n.language without risky getter spying
    (i18n as any).language = '';

    const { result: result2 } = renderHook(() => useAppI18n(), { wrapper });

    expect(result2.current.currentLanguage).toBeDefined();
    expect(result2.current.currentCode).toBeDefined();
  });

  it('should handle all supported languages', async () => {
    const supported = ['en', 'fr', 'pt', 'ar'] as const;

    for (const lang of supported) {
      await i18n.changeLanguage(lang);
      const { result } = renderHook(() => useAppI18n(), { wrapper });

      expect(result.current.currentCode).toBe(lang);
      expect(result.current.currentLanguage.code).toBe(lang);
      expect(['ltr', 'rtl']).toContain(result.current.dir);
    }
  });
});
