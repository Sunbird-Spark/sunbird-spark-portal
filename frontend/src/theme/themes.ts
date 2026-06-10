/**
 * Theme configuration.
 *
 * To add a new colour, font, template or layout, append an entry to the
 * relevant array below. To add a new theme, reference an existing
 * `colorId` (from COLOR_PALETTES) and `fontId` (from FONTS).
 */

export interface ThemeSeeds {
  primaryH: number;
  primaryS: string;
  primaryL: string;
  chipH: number;
  chipS: string;
  iconH: number;
}

export interface ColorPalette {
  id: string;
  name: string;
  seeds: ThemeSeeds;
}

export interface FontOption {
  id: string;
  name: string;
  value: string;
}

export interface Theme {
  id: string;
  name: string;
  colorId: string;
  fontId: string;
}

// Append to this array to add a template — TemplateId updates automatically.
export const TEMPLATE_IDS = ['classic', 'modern'] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export interface TemplateOption {
  id: TemplateId;
  name: string;
  description: string;
  /** Theme auto-applied when this template is selected. */
  presetThemeId: string;
  /** Font auto-applied when this template is selected. */
  presetFontId: string;
}

export type LayoutId = 'sidebar-left' | 'sidebar-right' | 'top' | 'bottom';

export interface LayoutOption {
  id: LayoutId;
  name: string;
}

// ─── Colour palettes ─────────────────────────────────────────────────────────

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'terracotta',
    name: 'Terracotta',
    seeds: { primaryH: 12, primaryS: '50%', primaryL: '45%', chipH: 45, chipS: '100%', iconH: 28 },
  },
  {
    id: 'blue',
    name: 'Professional Blue',
    seeds: { primaryH: 217, primaryS: '71%', primaryL: '46%', chipH: 217, chipS: '71%', iconH: 200 },
  },
  {
    id: 'teal',
    name: 'Nature Teal',
    seeds: { primaryH: 180, primaryS: '38%', primaryL: '38%', chipH: 180, chipS: '38%', iconH: 170 },
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    seeds: { primaryH: 270, primaryS: '55%', primaryL: '45%', chipH: 270, chipS: '55%', iconH: 280 },
  },
  {
    id: 'green',
    name: 'Forest Green',
    seeds: { primaryH: 145, primaryS: '45%', primaryL: '35%', chipH: 145, chipS: '45%', iconH: 155 },
  },
  {
    id: 'indigo',
    name: 'Ocean Indigo',
    seeds: { primaryH: 235, primaryS: '65%', primaryL: '48%', chipH: 235, chipS: '65%', iconH: 220 },
  },
  {
    id: 'rose',
    name: 'Blossom Rose',
    seeds: { primaryH: 345, primaryS: '60%', primaryL: '45%', chipH: 345, chipS: '60%', iconH: 335 },
  },
  {
    id: 'amber',
    name: 'Sunrise Amber',
    seeds: { primaryH: 35, primaryS: '80%', primaryL: '45%', chipH: 35, chipS: '80%', iconH: 25 },
  },
];

// ─── Fonts ───────────────────────────────────────────────────────────────────

export const FONTS: FontOption[] = [
  { id: 'poppins', name: 'Poppins', value: "'Poppins', sans-serif" },
  { id: 'rubik', name: 'Rubik', value: "'Rubik', sans-serif" },
  { id: 'inter', name: 'Inter', value: "'Inter', sans-serif" },
  { id: 'satisfy', name: 'Satisfy', value: "'Satisfy', cursive" },
  { id: 'lora', name: 'Lora', value: "'Lora', serif" },
];

// ─── Themes (compose colour + font) ──────────────────────────────────────────

export const THEMES: Theme[] = [
  { id: 'terracotta', name: 'Sunbird Spark', colorId: 'terracotta', fontId: 'rubik' },
  { id: 'blue', name: 'Professional', colorId: 'blue', fontId: 'inter' },
  { id: 'teal', name: 'Nature', colorId: 'teal', fontId: 'poppins' },
  { id: 'purple', name: 'Royal', colorId: 'purple', fontId: 'poppins' },
  { id: 'green', name: 'Forest', colorId: 'green', fontId: 'rubik' },
  { id: 'indigo', name: 'Ocean', colorId: 'indigo', fontId: 'inter' },
  { id: 'rose', name: 'Blossom', colorId: 'rose', fontId: 'poppins' },
  { id: 'amber', name: 'Sunrise', colorId: 'amber', fontId: 'rubik' },
];

// ─── Templates / layouts ─────────────────────────────────────────────────────

export const TEMPLATES: TemplateOption[] = [
  { id: 'classic', name: 'Classic', description: 'Warm, rounded', presetThemeId: 'terracotta', presetFontId: 'rubik' },
  { id: 'modern', name: 'Modern', description: 'Sharp, bold', presetThemeId: 'rose', presetFontId: 'inter' },
];

export const LAYOUTS: LayoutOption[] = [
  { id: 'sidebar-left', name: 'Left Sidebar' },
  { id: 'sidebar-right', name: 'Right Sidebar' },
  { id: 'top', name: 'Top Nav' },
  { id: 'bottom', name: 'Bottom Nav' },
];

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_THEME_ID = 'terracotta';
export const DEFAULT_FONT_ID = 'rubik';
export const DEFAULT_TEMPLATE_ID: TemplateOption['id'] = 'classic';
export const DEFAULT_LAYOUT_ID: LayoutId = 'sidebar-left';

// ─── Resolvers ───────────────────────────────────────────────────────────────

export function getColorPalette(colorId: string): ColorPalette {
  return COLOR_PALETTES.find((c) => c.id === colorId) ?? COLOR_PALETTES[0]!;
}

export function getFont(fontId: string): FontOption {
  return FONTS.find((f) => f.id === fontId) ?? FONTS.find((f) => f.id === DEFAULT_FONT_ID)!;
}

export function getThemeSeeds(theme: Theme): ThemeSeeds {
  return getColorPalette(theme.colorId).seeds;
}

// ─── Appliers (write to DOM) ─────────────────────────────────────────────────

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const seeds = getThemeSeeds(theme);
  root.style.setProperty('--sunbird-spark-theme-primary-h', String(seeds.primaryH));
  root.style.setProperty('--sunbird-spark-theme-primary-s', seeds.primaryS);
  root.style.setProperty('--sunbird-spark-theme-primary-l', seeds.primaryL);
  root.style.setProperty('--sunbird-spark-theme-chip-h', String(seeds.chipH));
  root.style.setProperty('--sunbird-spark-theme-chip-s', seeds.chipS);
  root.style.setProperty('--sunbird-spark-theme-icon-h', String(seeds.iconH));
}

export function applyFont(font: FontOption): void {
  document.documentElement.style.setProperty('--app-font-family', font.value);
}

export function applyTemplate(id: TemplateOption['id']): void {
  document.documentElement.setAttribute('data-template', id);
}

export function applyLayout(id: LayoutId): void {
  document.documentElement.setAttribute('data-layout', id);
}

export function themePreviewColor(theme: Theme): string {
  const { primaryH, primaryS, primaryL } = getThemeSeeds(theme);
  return `hsl(${primaryH} ${primaryS} ${primaryL})`;
}

// ─── Keycloak hand-off (id-based, same-origin localStorage) ─────────────────
//
// Keycloak login pages share the portal's origin, so they read the portal's
// localStorage directly. Portal persists three id keys on user selection:
//
//   sunbird-theme       "terracotta" | "blue" | ... (id from THEMES)
//   sunbird-font        "rubik" | "poppins" | ...   (id from FONTS)
//   sunbird-template    "classic" | "modern"        (id from TEMPLATES)
//
// The Keycloak FTL template (template.ftl) carries its own THEME_MAP /
// FONT_MAP (mirrors THEMES + FONTS here). Adding a new theme/font/template
// requires updating ALL THREE apps: portal (this file), mobile, Keycloak.
