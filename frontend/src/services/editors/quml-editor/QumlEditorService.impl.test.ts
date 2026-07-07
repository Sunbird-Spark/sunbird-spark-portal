// The QumlEditorService was simplified when migrating from the Angular web component
// (@project-sunbird/sunbird-questionset-editor-web-component) to the React package
// (@project-sunbird/sunbird-questionset-editor-web-component-react).
//
// Methods removed: initializeDependencies, loadScript, loadAssets, removeAssets,
//                  createElement, attachEventListeners, removeEventListeners
//
// Only createConfig() remains. Behavioural tests live in QumlEditorService.test.ts.
import { describe, it, expect } from 'vitest';
import { QumlEditorService } from './QumlEditorService';

describe('QumlEditorService (react package surface)', () => {
  it('exposes only createConfig from the legacy surface', () => {
    const service = new QumlEditorService() as unknown as Record<string, unknown>;
    expect(typeof service.createConfig).toBe('function');
    for (const removed of [
      'initializeDependencies', 'loadScript', 'loadAssets', 'removeAssets',
      'createElement', 'attachEventListeners', 'removeEventListeners',
    ]) {
      expect(service[removed]).toBeUndefined();
    }
  });
});
