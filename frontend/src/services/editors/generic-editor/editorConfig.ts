/**
 * Portal-owned configuration for the native @project-sunbird/generic-editor-v2 editor.
 *
 * The portal (host) supplies these values so the editor library does not hardcode them;
 * the library's internal defaults act only as a fallback. Mirrors the values the legacy
 * blob editor received via window.config (GENERIC_EDITOR_WINDOW_CONFIG).
 */
import type { EditorConfig } from '@project-sunbird/generic-editor-v2';

/** Path prefix for action APIs (proxied to upstream). */
export const EDITOR_API_SLUG = import.meta.env.VITE_EDITOR_API_SLUG || '/action';

/** Cloud storage provider used for presigned upload PUTs. */
export const EDITOR_CLOUD_STORAGE_PROVIDER = (
  import.meta.env.VITE_CLOUD_STORAGE_PROVIDER || 'azure'
) as 'azure' | 'aws';

/** Max upload size in MB for the normal (non-large) upload editor. */
export const DEFAULT_CONTENT_FILE_SIZE_MB = Number(
  import.meta.env.VITE_CONTENT_MAX_SIZE_MB || 150
);

/** Legacy ekstep content-renderer preview page. */
export const EDITOR_PREVIEW_URL =
  import.meta.env.VITE_EDITOR_PREVIEW_URL || '/content/preview/preview.html';

/** Telemetry sink for editor events. */
export const EDITOR_TELEMETRY_URL =
  import.meta.env.VITE_EDITOR_TELEMETRY_URL || `${EDITOR_API_SLUG}/data/v3/telemetry`;

/**
 * Asset (thumbnail/appIcon) endpoints. These go through the knowledge-mw `/action` proxy —
 * the same route the editor library uses via `apiSlug` — not the portal `/portal` http-client.
 */
export const EDITOR_ASSET_CREATE_URL = `${EDITOR_API_SLUG}/asset/v3/create`;
export const editorAssetUploadUrl = (assetId: string): string =>
  `${EDITOR_API_SLUG}/asset/v3/upload/${encodeURIComponent(assetId)}`;

/** Optional brand logo shown in the editor header (falls back to the built-in Sunbird logo). */
export const EDITOR_HEADER_LOGO = import.meta.env.VITE_EDITOR_HEADER_LOGO || '';

/**
 * Config object handed to the renderer's initializePreview({ config }) — mirrors the old
 * generic editor's previewConfig. `showEndpage: true` renders the endscreen in preview.
 */
export const EDITOR_PREVIEW_CONFIG: Record<string, unknown> = {
  showEndpage: true,
  repos: ['/content-plugins/renderer'],
  plugins: [{ id: 'org.sunbird.player.endpage', ver: 1.1, type: 'plugin' }],
  splash: {
    text: '',
    icon: '',
    bgImage: 'assets/icons/splacebackground_1.png',
    webLink: '',
  },
  overlay: { showUser: false },
};

/** Content statuses that may be opened for editing. */
export const VALID_CONTENT_STATUSES = [
  'Review',
  'Draft',
  'Live',
  'Unlisted',
  'FlagDraft',
  'FlagReview',
] as const;

/** Route states that grant access (creator/collaborator/reviewer). */
export const VALID_CONTENT_STATES = [
  'upForReview',
  'review',
  'published',
  'limitedPublish',
  'flagreviewer',
  'collaborating-on',
] as const;

/** Primary categories supported by the generic editor. */
export const DEFAULT_PRIMARY_CATEGORIES = [
  'eTextbook',
  'Explanation Content',
  'Learning Resource',
  'Practice Question Set',
  'Teacher Resource',
  'Exam Question',
] as const;

/**
 * Build the EditorConfig the portal passes to <ContentEditor config={...}>.
 *
 * In large-upload mode `maxFileSizeMB` is intentionally left unset so the editor applies
 * its own large-content cap (15 GB); forcing the normal 150 MB cap would break large uploads.
 */
export function buildEditorConfig(opts: {
  largeUpload: boolean;
  language?: string;
}): EditorConfig {
  const config: EditorConfig = {
    apiSlug: EDITOR_API_SLUG,
    cloudStorage: { provider: EDITOR_CLOUD_STORAGE_PROVIDER },
    primaryCategories: [...DEFAULT_PRIMARY_CATEGORIES],
    previewUrl: EDITOR_PREVIEW_URL,
    previewConfig: EDITOR_PREVIEW_CONFIG,
    telemetry: { url: EDITOR_TELEMETRY_URL },
    largeUpload: opts.largeUpload,
  };

  if (opts.language) config.language = opts.language;
  if (EDITOR_HEADER_LOGO) config.headerLogo = EDITOR_HEADER_LOGO;
  if (!opts.largeUpload) config.maxFileSizeMB = DEFAULT_CONTENT_FILE_SIZE_MB;

  return config;
}
