/**
 * Default configuration for the Generic Editor.
 * Mirrors the GENERIC_EDITOR section from SunbirdEd-portal's editor.config.json.
 */
import { TELEMETRY_ENDPOINT } from '../../players/telemetryContextBuilder';

/** Default window.config values for the generic editor iframe */
export const GENERIC_EDITOR_WINDOW_CONFIG = {
  corePluginsPackaged: true,
  modalId: 'genericEditor',
  dispatcher: 'local',
  apislug: '/action',
  alertOnUnload: true,
  localDispatcherEndpoint: TELEMETRY_ENDPOINT,
  loadingImage: '',
  cloudStorage: {
    provider: 'azure',
  },
  plugins: [
    { id: 'org.ekstep.sunbirdcommonheader', ver: '2.0', type: 'plugin' },
    { id: 'org.ekstep.sunbirdmetadata', ver: '1.1', type: 'plugin' },
    { id: 'org.ekstep.metadata', ver: '1.5', type: 'plugin' },
  ],
  previewConfig: {
    repos: ['/content-plugins/renderer'],
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

/** Primary categories supported by the generic editor */
export const DEFAULT_PRIMARY_CATEGORIES = [
  'eTextbook',
  'Explanation Content',
  'Learning Resource',
  'Practice Question Set',
  'Teacher Resource',
  'Exam Question',
] as const;
