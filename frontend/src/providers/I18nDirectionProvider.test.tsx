import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import I18nDirectionProvider from './I18nDirectionProvider';
import { useAppI18n } from '../hooks/useAppI18n';

// Mock the hook
vi.mock('../hooks/useAppI18n', () => ({
  useAppI18n: vi.fn(),
}));

describe('I18nDirectionProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document attributes before each test
    document.documentElement.dir = '';
    document.body.dir = '';
    document.documentElement.lang = '';
    document.documentElement.style.removeProperty('--app-font-family');
  });

  it('updates document and body attributes based on initial i18n settings', () => {
    (useAppI18n as any).mockReturnValue({
      dir: 'rtl',
      currentCode: 'ar',
      currentLanguage: { font: 'Amiri, serif' },
    });

    render(
      <I18nDirectionProvider>
        <div data-testid="child">Test Child</div>
      </I18nDirectionProvider>
    );

    expect(document.documentElement.dir).toBe('rtl');
    expect(document.body.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.style.getPropertyValue('--app-font-family')).toBe('Amiri, serif');
  });

  it('updates attributes correctly when switching from LTR to RTL', () => {
    // Start with LTR (English)
    (useAppI18n as any).mockReturnValue({
      dir: 'ltr',
      currentCode: 'en',
      currentLanguage: { font: 'Inter, sans-serif' },
    });

    const { rerender } = render(
      <I18nDirectionProvider>
        <div>Test Child</div>
      </I18nDirectionProvider>
    );

    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.style.getPropertyValue('--app-font-family')).toBe('Inter, sans-serif');

    // Mock language change to Arabic (RTL)
    (useAppI18n as any).mockReturnValue({
      dir: 'rtl',
      currentCode: 'ar',
      currentLanguage: { font: 'Amiri, serif' },
    });

    // Re-render to trigger useEffect with new values
    rerender(
      <I18nDirectionProvider>
        <div>Test Child</div>
      </I18nDirectionProvider>
    );

    expect(document.documentElement.dir).toBe('rtl');
    expect(document.body.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.style.getPropertyValue('--app-font-family')).toBe('Amiri, serif');
  });

  it('renders children correctly', () => {
    (useAppI18n as any).mockReturnValue({
      dir: 'ltr',
      currentCode: 'en',
      currentLanguage: { font: 'Inter' },
    });

    const { getByText } = render(
      <I18nDirectionProvider>
        <div>Hello World</div>
      </I18nDirectionProvider>
    );

    expect(getByText('Hello World')).toBeInTheDocument();
  });
});
