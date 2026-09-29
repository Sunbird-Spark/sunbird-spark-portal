import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeProvider';
import { useAppI18n } from '@/hooks/useAppI18n';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: vi.fn(),
}));

const mockLanguage = (forceFont = false, font = "'Rubik', sans-serif") => {
  (useAppI18n as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    currentLanguage: {
      code: forceFont ? 'ar' : 'en',
      label: forceFont ? 'العربية' : 'English',
      dir: forceFont ? 'rtl' : 'ltr',
      index: 1,
      font,
      forceFont,
    },
    currentCode: forceFont ? 'ar' : 'en',
    dir: forceFont ? 'rtl' : 'ltr',
  });
};

const Harness = ({ onReady }: { onReady: (api: ReturnType<typeof useTheme>) => void }) => {
  const api = useTheme();
  onReady(api);
  return null;
};

describe('ThemeProvider — font + language interaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.style.removeProperty('--app-font-family');
  });

  it('writes theme font for LTR languages', () => {
    mockLanguage(false);
    render(
      <ThemeProvider>
        <Harness onReady={() => {}} />
      </ThemeProvider>
    );
    // Default font (DEFAULT_FONT_ID) is Rubik
    expect(document.documentElement.style.getPropertyValue('--app-font-family'))
      .toContain('Rubik');
  });

  it('forces language font for Arabic regardless of activeFont', () => {
    mockLanguage(true, "'Noto Sans Arabic', sans-serif");
    render(
      <ThemeProvider>
        <Harness onReady={() => {}} />
      </ThemeProvider>
    );
    expect(document.documentElement.style.getPropertyValue('--app-font-family'))
      .toBe("'Noto Sans Arabic', sans-serif");
  });

  it('keeps Arabic font when user picks a different font via setFont', () => {
    mockLanguage(true, "'Noto Sans Arabic', sans-serif");
    let api: ReturnType<typeof useTheme>;
    render(
      <ThemeProvider>
        <Harness onReady={(a) => { api = a; }} />
      </ThemeProvider>
    );

    expect(document.documentElement.style.getPropertyValue('--app-font-family'))
      .toBe("'Noto Sans Arabic', sans-serif");

    act(() => api!.setFont('satisfy'));

    // Still Noto — Arabic forces its font over the picker.
    expect(document.documentElement.style.getPropertyValue('--app-font-family'))
      .toBe("'Noto Sans Arabic', sans-serif");
  });

  it('keeps Arabic font when user picks a template that cascades a different font', () => {
    mockLanguage(true, "'Noto Sans Arabic', sans-serif");
    let api: ReturnType<typeof useTheme>;
    render(
      <ThemeProvider>
        <Harness onReady={(a) => { api = a; }} />
      </ThemeProvider>
    );

    act(() => api!.setTemplate('modern'));

    // Modern template's presetFontId is `inter`. Cascade fires setActiveFont,
    // but Arabic forceFont overrides — Noto stays.
    expect(document.documentElement.style.getPropertyValue('--app-font-family'))
      .toBe("'Noto Sans Arabic', sans-serif");
  });

  it('keeps Arabic font when user picks a theme that cascades a different font', () => {
    mockLanguage(true, "'Noto Sans Arabic', sans-serif");
    let api: ReturnType<typeof useTheme>;
    render(
      <ThemeProvider>
        <Harness onReady={(a) => { api = a; }} />
      </ThemeProvider>
    );

    act(() => api!.setTheme('blue'));

    expect(document.documentElement.style.getPropertyValue('--app-font-family'))
      .toBe("'Noto Sans Arabic', sans-serif");
  });
});

describe('ThemeProvider — URL param hand-off', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockLanguage(false);
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('persists matched catalog ids to localStorage for valid params', () => {
    window.history.replaceState({}, '', '/?template=modern&theme=blue&font=satisfy&layout=top');
    render(
      <ThemeProvider>
        <Harness onReady={() => {}} />
      </ThemeProvider>
    );
    expect(localStorage.getItem('sunbird-template')).toBe('modern');
    expect(localStorage.getItem('sunbird-theme')).toBe('blue');
    expect(localStorage.getItem('sunbird-font')).toBe('satisfy');
    expect(localStorage.getItem('sunbird-layout')).toBe('top');
  });

  it('does not write to localStorage for params that match no catalog entry', () => {
    window.history.replaceState({}, '', '/?template=evil&theme=evil&font=evil&layout=evil');
    render(
      <ThemeProvider>
        <Harness onReady={() => {}} />
      </ThemeProvider>
    );
    expect(localStorage.getItem('sunbird-template')).toBeNull();
    expect(localStorage.getItem('sunbird-theme')).toBeNull();
    expect(localStorage.getItem('sunbird-font')).toBeNull();
    expect(localStorage.getItem('sunbird-layout')).toBeNull();
  });
});
