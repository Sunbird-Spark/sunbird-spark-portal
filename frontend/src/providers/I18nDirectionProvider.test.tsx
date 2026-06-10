import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import I18nDirectionProvider from './I18nDirectionProvider';
import { useAppI18n } from '../hooks/useAppI18n';

vi.mock('../hooks/useAppI18n', () => ({
  useAppI18n: vi.fn(),
}));

describe('I18nDirectionProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.dir = '';
    document.body.dir = '';
    document.documentElement.lang = '';
  });

  it('writes dir and lang for RTL language', () => {
    (useAppI18n as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      dir: 'rtl',
      currentCode: 'ar',
    });

    render(
      <I18nDirectionProvider>
        <div>child</div>
      </I18nDirectionProvider>
    );

    expect(document.documentElement.dir).toBe('rtl');
    expect(document.body.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
  });

  it('writes dir and lang for LTR language', () => {
    (useAppI18n as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      dir: 'ltr',
      currentCode: 'en',
    });

    render(
      <I18nDirectionProvider>
        <div>child</div>
      </I18nDirectionProvider>
    );

    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  it('renders children', () => {
    (useAppI18n as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      dir: 'ltr',
      currentCode: 'en',
    });

    const { getByText } = render(
      <I18nDirectionProvider>
        <div>Hello</div>
      </I18nDirectionProvider>
    );

    expect(getByText('Hello')).toBeInTheDocument();
  });
});
