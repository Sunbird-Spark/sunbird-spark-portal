/**
 * Default configuration for the Generic Editor.
 * Mirrors the GENERIC_EDITOR section from SunbirdEd-portal's editor.config.json.
 */

import type { GenericEditorWindowConfig } from './types';

/** Default window.config values for the generic editor iframe */
export const DEFAULT_WINDOW_CONFIG: Omit<GenericEditorWindowConfig, 'build_number' | 'headerLogo' | 'lock' | 'extContWhitelistedDomains' | 'enableTelemetryValidation' | 'videoMaxSize' | 'defaultContentFileSize'> = {
  corePluginsPackaged: true,
  modalId: 'genericEditor',
  dispatcher: 'local',
  apislug: '/action',
  alertOnUnload: true,
  loadingImage: '',
  cloudStorage: {
    provider: '',
  },
  plugins: [
    { id: 'org.ekstep.sunbirdcommonheader', ver: '1.9', type: 'plugin' },
    { id: 'org.ekstep.sunbirdmetadata', ver: '1.1', type: 'plugin' },
    { id: 'org.ekstep.metadata', ver: '1.5', type: 'plugin' },
  ],
  previewConfig: {
    repos: ['/sunbird-plugins/renderer'],
    plugins: [
      { id: 'org.sunbird.player.endpage', ver: 1.1, type: 'plugin' },
    ],
    splash: {
      text: '',
      icon: '',
      bgImage: 'assets/icons/splacebackground_1.png',
      webLink: '',
    },
    overlay: { showUser: false },
    showEndPage: false,
  },
};

/** Valid content states that allow access to the editor */
export const VALID_CONTENT_STATES = [
  'upForReview',
  'review',
  'published',
  'limitedPublish',
  'flagreviewer',
  'collaborating-on',
] as const;

/** Valid content statuses for editing */
export const VALID_CONTENT_STATUSES = [
  'Review',
  'Draft',
  'Live',
  'Unlisted',
  'FlagDraft',
  'FlagReview',
] as const;

/** States that allow editing with content lock */
export const EDITABLE_STATES = ['draft', 'allcontent', 'collaborating-on', 'uploaded'] as const;

/** Default whitelisted domains for external content */
export const DEFAULT_EXT_CONT_WHITELISTED_DOMAINS = 'youtube.com,youtu.be';

/** Default video max size in MB */
export const DEFAULT_VIDEO_MAX_SIZE = '100';

/** Default content file size in MB */
export const DEFAULT_CONTENT_FILE_SIZE = 150;
