import { FiBook, FiFileText, FiHelpCircle, FiFolder } from 'react-icons/fi';
import type { WorkspaceItem } from '../../types/workspaceTypes';
import type { EmptyStateVariant } from '../../types/workspaceTypes';

export const CONTENT_TYPE_ICONS: Record<WorkspaceItem['type'], typeof FiBook> = {
  course: FiBook,
  content: FiFileText,
  quiz: FiHelpCircle,
  collection: FiFolder,
};

export const CONTENT_TYPE_COLORS: Record<WorkspaceItem['type'], string> = {
  course: 'text-sunbird-ink bg-sunbird-wave/10',
  content: 'text-sunbird-brick bg-sunbird-ginger/10',
  quiz: 'text-sunbird-lavender bg-sunbird-lavender/10',
  collection: 'text-sunbird-forest bg-sunbird-moss/10',
};

export const CONTENT_TYPE_CARD_COLORS: Record<
  WorkspaceItem['type'],
  { bg: string; text: string }
> = {
  course: { bg: 'bg-sunbird-wave/10', text: 'text-sunbird-ink' },
  content: { bg: 'bg-sunbird-ginger/10', text: 'text-sunbird-brick' },
  quiz: { bg: 'bg-sunbird-lavender/10', text: 'text-sunbird-lavender' },
  collection: { bg: 'bg-sunbird-moss/10', text: 'text-sunbird-forest' },
};

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
