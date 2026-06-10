import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  THEMES,
  FONTS,
  TEMPLATES,
  LAYOUTS,
  DEFAULT_THEME_ID,
  DEFAULT_FONT_ID,
  DEFAULT_TEMPLATE_ID,
  DEFAULT_LAYOUT_ID,
  applyTheme,
  applyTemplate,
  applyLayout,
  type Theme,
  type FontOption,
  type TemplateOption,
  type LayoutOption,
} from '@/theme/themes';
import { useAppI18n } from '@/hooks/useAppI18n';

const THEME_STORAGE_KEY = 'sunbird-theme';
const FONT_STORAGE_KEY = 'sunbird-font';
const TEMPLATE_STORAGE_KEY = 'sunbird-template';
const LAYOUT_STORAGE_KEY = 'sunbird-layout';

interface ThemeContextValue {
  activeTheme: Theme;
  setTheme: (id: string) => void;
  themes: Theme[];
  activeFont: FontOption;
  setFont: (id: string) => void;
  fonts: FontOption[];
  activeTemplate: TemplateOption;
  setTemplate: (id: TemplateOption['id']) => void;
  templates: TemplateOption[];
  activeLayout: LayoutOption;
  setLayout: (id: LayoutOption['id']) => void;
  layouts: LayoutOption[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activeTheme, setActiveTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.find((t) => t.id === saved) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!;
  });

  const [activeFont, setActiveFont] = useState<FontOption>(() => {
    const saved = localStorage.getItem(FONT_STORAGE_KEY);
    return FONTS.find((f) => f.id === saved) ?? FONTS.find((f) => f.id === DEFAULT_FONT_ID)!;
  });

  const [activeTemplate, setActiveTemplate] = useState<TemplateOption>(() => {
    const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    return TEMPLATES.find((t) => t.id === saved) ?? TEMPLATES.find((t) => t.id === DEFAULT_TEMPLATE_ID)!;
  });

  const [activeLayout, setActiveLayout] = useState<LayoutOption>(() => {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return LAYOUTS.find((l) => l.id === saved) ?? LAYOUTS.find((l) => l.id === DEFAULT_LAYOUT_ID)!;
  });

  const { currentLanguage } = useAppI18n();

  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  // Single source of truth for `--app-font-family` (mirrors mobile-app
  // ThemeContext). Watches both the user-picked font AND the active
  // language. Script-locked languages (Arabic etc. via `forceFont`)
  // override the theme font; otherwise honour the picker.
  useEffect(() => {
    const value = currentLanguage.forceFont ? currentLanguage.font : activeFont.value;
    document.documentElement.style.setProperty('--app-font-family', value);
  }, [activeFont, currentLanguage]);

  useEffect(() => {
    applyTemplate(activeTemplate.id);
  }, [activeTemplate]);

  useEffect(() => {
    applyLayout(activeLayout.id);
  }, [activeLayout]);

  // On first mount, honour theme/font/template/layout hand-off from the
  // mobile InAppBrowser (see AuthWebviewService). All four are id-based —
  // portal looks each id up in its own catalog and silently ignores unknown
  // ids (CSS :root defaults take over).
  //
  //   ?theme=<id>     — looked up in THEMES, applied as full theme
  //   ?font=<id>      — looked up in FONTS, applied as active font
  //   ?template=<id>  — looked up in TEMPLATES, applied as data-template
  //   ?layout=<id>    — looked up in LAYOUTS, applied as data-layout
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const templateParam = params.get('template');
    const themeParam = params.get('theme');
    const fontParam = params.get('font');
    const layoutParam = params.get('layout');

    if (templateParam) {
      const matchedTemplate = TEMPLATES.find((t) => t.id === templateParam);
      if (matchedTemplate) {
        localStorage.setItem(TEMPLATE_STORAGE_KEY, templateParam);
        setActiveTemplate(matchedTemplate);
      }
    }
    if (themeParam) {
      const matchedTheme = THEMES.find((t) => t.id === themeParam);
      if (matchedTheme) {
        localStorage.setItem(THEME_STORAGE_KEY, themeParam);
        setActiveTheme(matchedTheme);
      }
    }
    if (fontParam) {
      const matchedFont = FONTS.find((f) => f.id === fontParam);
      if (matchedFont) {
        localStorage.setItem(FONT_STORAGE_KEY, fontParam);
        setActiveFont(matchedFont);
      }
    }
    if (layoutParam) {
      const matchedLayout = LAYOUTS.find((l) => l.id === layoutParam);
      if (matchedLayout) {
        localStorage.setItem(LAYOUT_STORAGE_KEY, layoutParam);
        setActiveLayout(matchedLayout);
      }
    }
  }, []);

  const setTheme = (id: string) => {
    const theme = THEMES.find((t) => t.id === id);
    if (!theme) return;
    // Colour-only — independent of font (mobile-app parity). Picking a colour
    // never changes the active font. Only a template preset binds both
    // (see setTemplate). `theme.fontId` is used solely as the template preset
    // source, not applied on colour selection.
    localStorage.setItem(THEME_STORAGE_KEY, id);
    setActiveTheme(theme);
  };

  const setFont = (id: string) => {
    const font = FONTS.find((f) => f.id === id);
    if (!font) return;
    localStorage.setItem(FONT_STORAGE_KEY, id);
    setActiveFont(font);
  };

  const setTemplate = (id: TemplateOption['id']) => {
    const template = TEMPLATES.find((t) => t.id === id);
    if (!template) return;
    localStorage.setItem(TEMPLATE_STORAGE_KEY, id);
    setActiveTemplate(template);
    // Cascade: picking a template applies its preset theme + font (mobile-app
    // parity). User can still override theme/font afterward.
    const presetTheme = THEMES.find((t) => t.id === template.presetThemeId);
    if (presetTheme) {
      localStorage.setItem(THEME_STORAGE_KEY, presetTheme.id);
      setActiveTheme(presetTheme);
    }
    const presetFont = FONTS.find((f) => f.id === template.presetFontId);
    if (presetFont) {
      localStorage.setItem(FONT_STORAGE_KEY, presetFont.id);
      setActiveFont(presetFont);
    }
  };

  const setLayout = (id: LayoutOption['id']) => {
    const layout = LAYOUTS.find((l) => l.id === id);
    if (!layout) return;
    localStorage.setItem(LAYOUT_STORAGE_KEY, id);
    setActiveLayout(layout);
  };

  return (
    <ThemeContext.Provider
      value={{
        activeTheme,
        setTheme,
        themes: THEMES,
        activeFont,
        setFont,
        fonts: FONTS,
        activeTemplate,
        setTemplate,
        templates: TEMPLATES,
        activeLayout,
        setLayout,
        layouts: LAYOUTS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
