import {
  FiBook,
  FiBookOpen,
  FiFileText,
  FiHelpCircle,
  FiFolder,
  FiVideo,
  FiPlay,
  FiClipboard,
  FiAward,
  FiEdit2,
  FiLayers,
  FiUsers,
  FiStar,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import type { WorkspaceItem } from '../../types/workspaceTypes';
import type { EmptyStateVariant } from '../../types/workspaceTypes';

/* ─── Type-level icon fallback (internal only) ─── */

const CONTENT_TYPE_ICONS: Record<WorkspaceItem['type'], IconType> = {
  course: FiBook,
  content: FiFileText,
  quiz: FiHelpCircle,
  collection: FiFolder,
};

/* ─── Content-type colour tokens ─── */

/**
 * Per-type colour pair used for badges and UI accents.
 * Single source of truth — `CONTENT_TYPE_COLORS` is derived from this.
 */
// Theme-reactive: badge colours rotate around the wheel from the active
// primary hue, so a theme switch shifts every workspace card colour together.
// Tokens defined in index.css (--ws-card-*-bg / --ws-card-*-text).
export const CONTENT_TYPE_CARD_COLORS: Record<
  WorkspaceItem['type'],
  { bg: string; text: string }
> = {
  course:     { bg: 'bg-ws-course-bg',     text: 'text-ws-course-fg' },
  content:    { bg: 'bg-ws-content-bg',    text: 'text-ws-content-fg' },
  quiz:       { bg: 'bg-ws-quiz-bg',       text: 'text-ws-quiz-fg' },
  collection: { bg: 'bg-ws-collection-bg', text: 'text-ws-collection-fg' },
};

/** Flattened version of `CONTENT_TYPE_CARD_COLORS` ("text bg" string). */
export const CONTENT_TYPE_COLORS: Record<WorkspaceItem['type'], string> =
  Object.fromEntries(
    (Object.entries(CONTENT_TYPE_CARD_COLORS) as [WorkspaceItem['type'], { bg: string; text: string }][]).map(
      ([key, { bg, text }]) => [key, `${text} ${bg}`],
    ),
  ) as Record<WorkspaceItem['type'], string>;

/* ─── Status badge config ─── */

export const getStatusConfig = (t: (key: string) => string): Record<
  WorkspaceItem['status'],
  { label: string; bg: string; text: string; dot?: string }
> => ({
  draft: {
    label: t('status.draft'),
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  review: {
    label: t('status.inReview'),
    bg: 'bg-sunbird-sunflower/20',
    text: 'text-sunbird-theme-accent',
    dot: 'bg-sunbird-theme-accent-muted',
  },
  published: {
    label: t('status.published'),
    bg: 'bg-sunbird-moss/15',
    text: 'text-sunbird-forest',
    dot: 'bg-sunbird-moss',
  },
  processing: {
    label: t('status.processing'),
    bg: 'bg-sunbird-sunflower/20',
    text: 'text-sunbird-theme-accent',
    dot: 'bg-sunbird-theme-accent-muted',
  },
});

// Legacy export for backward compatibility
export const STATUS_CONFIG: Record<
  WorkspaceItem['status'],
  { label: string; bg: string; text: string; dot?: string }
> = {
  draft: {
    label: 'Draft',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  review: {
    label: 'In Review',
    bg: 'bg-sunbird-sunflower/20',
    text: 'text-sunbird-theme-accent',
    dot: 'bg-sunbird-theme-accent-muted',
  },
  published: {
    label: 'Published',
    bg: 'bg-sunbird-moss/15',
    text: 'text-sunbird-forest',
    dot: 'bg-sunbird-moss',
  },
   processing: {
    label: "Processing",
    bg: 'bg-sunbird-sunflower/20',
    text: 'text-sunbird-theme-accent',
    dot: 'bg-sunbird-theme-accent-muted',
  },
};

/* ─── Empty-state variant styles ─── */

export const EMPTY_STATE_VARIANT_STYLES: Record<
  EmptyStateVariant,
  { iconBg: string; iconColor: string; buttonBg: string }
> = {
  default: {
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
    buttonBg: 'bg-sunbird-theme-accent-muted hover:bg-sunbird-theme-accent',
  },
  uploads: {
    iconBg: 'bg-sunbird-theme-accent-muted/10',
    iconColor: 'text-sunbird-theme-accent-muted',
    buttonBg: 'bg-sunbird-theme-accent-muted hover:bg-sunbird-theme-accent',
  },
  collaborations: {
    iconBg: 'bg-sunbird-wave/10',
    iconColor: 'text-sunbird-wave',
    buttonBg: 'bg-sunbird-wave hover:bg-sunbird-ink',
  },
  search: {
    iconBg: 'bg-sunbird-lavender/10',
    iconColor: 'text-sunbird-lavender',
    buttonBg: 'bg-sunbird-theme-accent-muted hover:bg-sunbird-theme-accent',
  },
};

/* ═══════════════════════════════════════════════════════════════════
   Light-themed Card Thumbnail — colours & icons per primaryCategory
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Describes the colour tokens used to render a card thumbnail background.
 * All values are CSS color strings (HSL tokens) that can be used directly in styles.
 */
export interface CardTheme {
  /** Short unique prefix for SVG gradient IDs (avoids collisions). */
  id: string;
  /** Light tint for the gradient start. */
  bgLight: string;
  /** Slightly lighter tint for the gradient end. */
  bgLighter: string;
  /** Main accent colour used in shapes. */
  accent: string;
  /** Darker accent for secondary shapes / dots. */
  accentDark: string;
  /** Colour applied to the centred icon. */
  iconColor: string;
}

/* ── Shared base palettes (each family shares one set of colours) ── */

/**
 * Each family palette is hue-derived from the active theme via `--ws-pat-N-h`
 * (see index.css). Switching the global theme rotates every workspace card
 * thumbnail together. Bg / accent / icon use fixed L/S so contrast stays
 * predictable across hues.
 */
const makeHuePalette = (n: 1 | 2 | 3 | 4 | 5 | 6): Omit<CardTheme, 'id'> => ({
  bgLight:    `var(--ws-pat-${n}-bg-light)`,
  bgLighter:  `var(--ws-pat-${n}-bg-lighter)`,
  accent:     `var(--ws-pat-${n}-accent)`,
  accentDark: `var(--ws-pat-${n}-accent-dark)`,
  iconColor:  `var(--ws-pat-${n}-icon)`,
});

const THEME_WAVE      = makeHuePalette(1);
const THEME_SUNFLOWER = makeHuePalette(2);
const THEME_GINGER    = makeHuePalette(3);
const THEME_FOREST    = makeHuePalette(4);
const THEME_LAVENDER  = makeHuePalette(5);
const THEME_LEAF      = makeHuePalette(6);

/** Helper to stamp a unique `id` onto a shared base palette. */
const withId = (id: string, base: Omit<CardTheme, 'id'>): CardTheme => ({ id, ...base });

/**
 * Colour themes keyed by normalised primaryCategory.
 *
 *  Course / Digital Textbook   → Wave + Ink        (cool teal)
 *  eTextbook / Textbook        → Sunflower + Ginger (warm gold)
 *  Learning Resource (Video)   → Ginger + Brick    (warm amber)
 *  Teacher Resource / PDF      → Forest + Moss     (fresh green)
 *  Quiz / Assessment           → Lavender + Jamun  (soft plum)
 *  Collection / Playlist       → Leaf + Forest     (vibrant green)
 */
const PRIMARY_CATEGORY_THEMES: Record<string, CardTheme> = {
  // Course family
  course: withId('crs', THEME_WAVE),
  'digital textbook': withId('dtb', THEME_WAVE),

  // Textbook family
  etextbook: withId('etb', THEME_SUNFLOWER),
  textbook: withId('txb', THEME_SUNFLOWER),

  // Video / Learning Resource family
  'learning resource': withId('lrs', THEME_GINGER),
  'explanation content': withId('exc', THEME_GINGER),

  // PDF / Teacher Resource family
  'teacher resource': withId('trs', THEME_FOREST),

  // Quiz / Assessment family
  'practice question set': withId('pqs', THEME_LAVENDER),
  'course assessment': withId('cas', THEME_LAVENDER),
  'exam question': withId('exq', THEME_LAVENDER),
  'question paper': withId('qpp', THEME_LAVENDER),

  // Collection / Playlist family
  'content playlist': withId('cpl', THEME_LEAF),
};

/** Fallback themes keyed by WorkspaceItem type. */
const TYPE_FALLBACK_THEMES: Record<WorkspaceItem['type'], CardTheme> = {
  course: PRIMARY_CATEGORY_THEMES['course']!,
  content: PRIMARY_CATEGORY_THEMES['learning resource']!,
  quiz: PRIMARY_CATEGORY_THEMES['practice question set']!,
  collection: PRIMARY_CATEGORY_THEMES['content playlist']!,
};

/** Resolve the card colour theme based on `primaryCategory`, falling back to `type`. */
export function getPrimaryCategoryCardTheme(
  primaryCategory: string | undefined,
  type: WorkspaceItem['type'],
): CardTheme {
  if (primaryCategory) {
    const theme = PRIMARY_CATEGORY_THEMES[primaryCategory.toLowerCase()];
    if (theme) return theme;
  }
  return TYPE_FALLBACK_THEMES[type];
}

/* ─── Per-primaryCategory Icons ─── */

/**
 * Distinct icons keyed by normalised primaryCategory.
 *
 *  Course              → FiBookOpen   (open book – active learning)
 *  Digital Textbook    → FiBook       (traditional book – digital edition)
 *  eTextbook / Textbook→ FiBook       (book)
 *  Learning Resource   → FiVideo      (video content)
 *  Explanation Content → FiPlay       (playable explainer)
 *  Teacher Resource    → FiClipboard  (lesson plan / structured doc)
 *  Practice Question   → FiHelpCircle (question mark)
 *  Course Assessment   → FiAward      (graded evaluation)
 *  Exam Question       → FiEdit2      (writing an exam)
 *  Question Paper      → FiFileText   (printed paper)
 *  Content Playlist    → FiLayers     (stacked playlist)
 *  Leadership          → FiUsers      (people / team)
 *  Skills              → FiStar       (skill badge)
 */
const PRIMARY_CATEGORY_ICONS: Record<string, IconType> = {
  course: FiBookOpen,
  'digital textbook': FiBook,
  etextbook: FiBook,
  textbook: FiBook,
  'learning resource': FiVideo,
  'explanation content': FiPlay,
  'teacher resource': FiClipboard,
  'practice question set': FiHelpCircle,
  'course assessment': FiAward,
  'exam question': FiEdit2,
  'question paper': FiFileText,
  'content playlist': FiLayers,
  leadership: FiUsers,
  skills: FiStar,
};

/** Resolve the icon based on `primaryCategory`, falling back to `type`. */
export function getPrimaryCategoryIcon(
  primaryCategory: string | undefined,
  type: WorkspaceItem['type'],
): IconType {
  if (primaryCategory) {
    const icon = PRIMARY_CATEGORY_ICONS[primaryCategory.toLowerCase()];
    if (icon) return icon;
  }
  return CONTENT_TYPE_ICONS[type];
}
