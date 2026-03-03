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
export const CONTENT_TYPE_CARD_COLORS: Record<
  WorkspaceItem['type'],
  { bg: string; text: string }
> = {
  course: { bg: 'bg-sunbird-wave/10', text: 'text-sunbird-ink' },
  content: { bg: 'bg-sunbird-ginger/10', text: 'text-sunbird-brick' },
  quiz: { bg: 'bg-sunbird-lavender/10', text: 'text-sunbird-lavender' },
  collection: { bg: 'bg-sunbird-moss/10', text: 'text-sunbird-forest' },
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
    text: 'text-sunbird-brick',
    dot: 'bg-sunbird-ginger',
  },
  published: {
    label: t('status.published'),
    bg: 'bg-sunbird-moss/15',
    text: 'text-sunbird-forest',
    dot: 'bg-sunbird-moss',
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
    text: 'text-sunbird-brick',
    dot: 'bg-sunbird-ginger',
  },
  published: {
    label: 'Published',
    bg: 'bg-sunbird-moss/15',
    text: 'text-sunbird-forest',
    dot: 'bg-sunbird-moss',
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
    buttonBg: 'bg-sunbird-ginger hover:bg-sunbird-brick',
  },
  uploads: {
    iconBg: 'bg-sunbird-ginger/10',
    iconColor: 'text-sunbird-ginger',
    buttonBg: 'bg-sunbird-ginger hover:bg-sunbird-brick',
  },
  collaborations: {
    iconBg: 'bg-sunbird-wave/10',
    iconColor: 'text-sunbird-wave',
    buttonBg: 'bg-sunbird-wave hover:bg-sunbird-ink',
  },
  search: {
    iconBg: 'bg-sunbird-lavender/10',
    iconColor: 'text-sunbird-lavender',
    buttonBg: 'bg-sunbird-ginger hover:bg-sunbird-brick',
  },
};

/* ═══════════════════════════════════════════════════════════════════
   Light-themed Card Thumbnail — colours & icons per primaryCategory
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Describes the colour tokens used to render a card thumbnail background.
 * All values are plain hex colours consumed by the SVG patterns.
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

const THEME_WAVE: Omit<CardTheme, 'id'> = {
  bgLight: '#e8f4f8',
  bgLighter: '#f2f9fb',
  accent: '#70adbf',
  accentDark: '#376673',
  iconColor: '#376673',
};

const THEME_SUNFLOWER: Omit<CardTheme, 'id'> = {
  bgLight: '#fff8e1',
  bgLighter: '#fffcf0',
  accent: '#ffdb73',
  accentDark: '#cc8545',
  iconColor: '#a85236',
};

const THEME_GINGER: Omit<CardTheme, 'id'> = {
  bgLight: '#fdf0e3',
  bgLighter: '#fef7f0',
  accent: '#cc8545',
  accentDark: '#a85236',
  iconColor: '#a85236',
};

const THEME_FOREST: Omit<CardTheme, 'id'> = {
  bgLight: '#eef5ea',
  bgLighter: '#f5f9f3',
  accent: '#82a668',
  accentDark: '#66a682',
  iconColor: '#4a7a3e',
};

const THEME_LAVENDER: Omit<CardTheme, 'id'> = {
  bgLight: '#f3edf1',
  bgLighter: '#f9f5f8',
  accent: '#99708a',
  accentDark: '#540f3b',
  iconColor: '#540f3b',
};

const THEME_LEAF: Omit<CardTheme, 'id'> = {
  bgLight: '#f2f5e2',
  bgLighter: '#f8f9ef',
  accent: '#a1a603',
  accentDark: '#82a668',
  iconColor: '#6b8a00',
};

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
