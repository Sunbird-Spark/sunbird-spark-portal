import { describe, it, expect } from 'vitest';
import {
  buildEditorConfig,
  DEFAULT_CONTENT_FILE_SIZE_MB,
  DEFAULT_PRIMARY_CATEGORIES,
  EDITOR_API_SLUG,
  EDITOR_PREVIEW_URL,
  EDITOR_TELEMETRY_URL,
} from './editorConfig';

describe('buildEditorConfig', () => {
  it('sends the portal-owned config fields', () => {
    const config = buildEditorConfig({ largeUpload: false, language: 'en' });

    expect(config.apiSlug).toBe(EDITOR_API_SLUG);
    expect(config.cloudStorage).toEqual({ provider: 'azure' });
    expect(config.primaryCategories).toEqual([...DEFAULT_PRIMARY_CATEGORIES]);
    expect(config.previewUrl).toBe(EDITOR_PREVIEW_URL);
    expect(config.previewConfig).toMatchObject({ showEndpage: true });
    expect(config.telemetry).toEqual({ url: EDITOR_TELEMETRY_URL });
    expect(config.language).toBe('en');
  });

  it('sets the 150 MB cap in normal upload mode', () => {
    const config = buildEditorConfig({ largeUpload: false });
    expect(config.maxFileSizeMB).toBe(DEFAULT_CONTENT_FILE_SIZE_MB);
    expect(config.largeUpload).toBe(false);
  });

  it('omits maxFileSizeMB in large-upload mode (editor keeps its 15 GB cap)', () => {
    const config = buildEditorConfig({ largeUpload: true });
    expect(config.maxFileSizeMB).toBeUndefined();
    expect(config.largeUpload).toBe(true);
  });

  it('omits language when not provided', () => {
    const config = buildEditorConfig({ largeUpload: false });
    expect(config.language).toBeUndefined();
  });
});
