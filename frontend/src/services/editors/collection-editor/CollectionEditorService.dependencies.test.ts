import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CollectionEditorService } from './CollectionEditorService';
describe('CollectionEditorService - Dependencies', () => {
  let service: CollectionEditorService;
  beforeEach(() => {
    service = new CollectionEditorService();
    (CollectionEditorService as any).dependenciesLoaded = false;
    (CollectionEditorService as any).stylesLoaded = false;
    (globalThis as any).$ = undefined;
    (globalThis as any).jQuery = undefined;
  });
  afterEach(() => {
    document.querySelectorAll('script[data-src]').forEach(el => el.remove());
    document.querySelectorAll('[data-collection-editor-styles]').forEach(el => el.remove());
    document.querySelectorAll('link[href*="collection-editor"]').forEach(el => el.remove());
    vi.clearAllMocks();
  });
  describe('loadScriptOnce', () => {
    it('loads a script and marks it as loaded', async () => {
      const mockAppendChild: any = vi.fn((node: any) => {
        setTimeout(() => {
          if (node.tagName === 'SCRIPT' && node.onload) {
            node.dataset.loaded = 'true';
            node.onload(new Event('load'));
          }
        }, 5);
        return node;
      });
      vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      const loadScriptOnce = (service as any).loadScriptOnce.bind(service);
      const url = 'https://example.com/test.js';
      await loadScriptOnce(url);
      const script = mockAppendChild.mock.calls[0][0];
      expect(script.dataset.loaded).toBe('true');
    });
    it('reuses existing loaded script', async () => {
      const loadScriptOnce = (service as any).loadScriptOnce.bind(service);
      const url = 'https://example.com/test2.js';
      const existingScript = document.createElement('script');
      existingScript.src = url;
      existingScript.dataset.src = url;
      existingScript.dataset.loaded = 'true';
      document.head.appendChild(existingScript);
      await loadScriptOnce(url);
      const scripts = document.querySelectorAll(`script[data-src="${url}"]`);
      expect(scripts.length).toBe(1);
    });
    it('waits for existing loading script to complete', async () => {
      const loadScriptOnce = (service as any).loadScriptOnce.bind(service);
      const url = 'https://example.com/test3.js';
      const existingScript = document.createElement('script');
      existingScript.src = url;
      existingScript.dataset.src = url;
      document.head.appendChild(existingScript);
      const promise = loadScriptOnce(url);
      setTimeout(() => {
        existingScript.dataset.loaded = 'true';
        existingScript.dispatchEvent(new Event('load'));
      }, 10);
      await promise;
      const scripts = document.querySelectorAll(`script[data-src="${url}"]`);
      expect(scripts.length).toBe(1);
    });
    it('rejects when script fails to load', async () => {
      vi.spyOn(document.body, 'appendChild').mockImplementation((node: any) => {
        setTimeout(() => {
          if (node.tagName === 'SCRIPT' && node.onerror) {
            node.onerror(new Event('error'));
          }
        }, 5);
        return node;
      });
      const loadScriptOnce = (service as any).loadScriptOnce.bind(service);
      const url = 'https://example.com/fail.js';
      await expect(loadScriptOnce(url)).rejects.toThrow();
    });
    it('rejects when existing script fails to load', async () => {
      const loadScriptOnce = (service as any).loadScriptOnce.bind(service);
      const url = 'https://example.com/fail2.js';
      const existingScript = document.createElement('script');
      existingScript.src = url;
      existingScript.dataset.src = url;
      document.head.appendChild(existingScript);
      const promise = loadScriptOnce(url);
      setTimeout(() => {
        existingScript.dispatchEvent(new Event('error'));
      }, 10);
      await expect(promise).rejects.toThrow();
    });
  });
  describe('initializeDependencies', () => {
    it('returns early if dependencies already loaded', async () => {
      (CollectionEditorService as any).dependenciesLoaded = true;
      await service.initializeDependencies();
      expect(document.querySelectorAll('script[data-src]').length).toBe(0);
    });
    it('loads jQuery from npm package', async () => {
      vi.spyOn(service as any, 'loadScriptOnce').mockResolvedValue(undefined);
      const mockJQuery = vi.fn() as any;
      mockJQuery.ui = {};
      mockJQuery.fn = { fancytree: {} };
      (globalThis as any).$ = mockJQuery;
      (globalThis as any).jQuery = mockJQuery;
      const customElementsMock = { get: vi.fn().mockReturnValue(class {}) };
      globalThis.customElements = customElementsMock as any;
      await service.initializeDependencies();
      expect((globalThis as any).$).toBeDefined();
      expect((globalThis as any).jQuery).toBeDefined();
    });
    it('skips jQuery loading if already present', async () => {
      const existingJQuery = vi.fn() as any;
      existingJQuery.ui = {};
      existingJQuery.fn = { fancytree: {} };
      (globalThis as any).$ = existingJQuery;
      (globalThis as any).jQuery = existingJQuery;
      vi.spyOn(service as any, 'loadScriptOnce').mockResolvedValue(undefined);
      const customElementsMock = { get: vi.fn().mockReturnValue(class {}) };
      globalThis.customElements = customElementsMock as any;
      await service.initializeDependencies();
      expect((globalThis as any).$).toBe(existingJQuery);
    });
    it('throws error if jQuery UI fails to load within timeout', async () => {
      const mockJQuery = vi.fn() as any;
      mockJQuery.ui = undefined;
      (globalThis as any).$ = mockJQuery;
      (globalThis as any).jQuery = mockJQuery;
      vi.spyOn(service as any, 'loadScriptOnce').mockResolvedValue(undefined);
      const promise = service.initializeDependencies();
      await expect(promise).rejects.toThrow('jQuery UI failed to load');
    }, 6000);
    it('throws error if FancyTree fails to load within timeout', async () => {
      const mockJQuery = vi.fn() as any;
      mockJQuery.ui = {};
      mockJQuery.fn = {};
      (globalThis as any).$ = mockJQuery;
      (globalThis as any).jQuery = mockJQuery;
      vi.spyOn(service as any, 'loadScriptOnce').mockResolvedValue(undefined);
      const promise = service.initializeDependencies();
      await expect(promise).rejects.toThrow('FancyTree failed to load');
    }, 6000);
    it('loads assets and sets dependencies flag', async () => {
      const mockJQuery = vi.fn() as any;
      mockJQuery.ui = {};
      mockJQuery.fn = { fancytree: {} };
      (globalThis as any).$ = mockJQuery;
      (globalThis as any).jQuery = mockJQuery;
      vi.spyOn(service as any, 'loadScriptOnce').mockResolvedValue(undefined);
      const customElementsMock = { get: vi.fn().mockReturnValue(class {}) };
      globalThis.customElements = customElementsMock as any;
      await service.initializeDependencies();
      expect((CollectionEditorService as any).dependenciesLoaded).toBe(true);
      expect((CollectionEditorService as any).stylesLoaded).toBe(true);
    });
    it('loads web component script', async () => {
      const mockJQuery = vi.fn() as any;
      mockJQuery.ui = {};
      mockJQuery.fn = { fancytree: {} };
      (globalThis as any).$ = mockJQuery;
      (globalThis as any).jQuery = mockJQuery;
      vi.spyOn(service as any, 'loadScriptOnce').mockResolvedValue(undefined);
      const customElementsMock = { get: vi.fn().mockReturnValue(undefined) };
      globalThis.customElements = customElementsMock as any;
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      appendChildSpy.mockImplementation((node: any) => {
        if (node.tagName === 'SCRIPT' && node.src.includes('sunbird-collection-editor.js')) {
          setTimeout(() => node.onload?.(), 5);
        }
        return node;
      });
      await service.initializeDependencies();
      expect(appendChildSpy).toHaveBeenCalled();
      const wcCall = appendChildSpy.mock.calls.find((call: any) => 
        call[0].src?.includes('sunbird-collection-editor.js')
      );
      expect(wcCall).toBeTruthy();
    });
    it('skips web component loading if already registered', async () => {
      const mockJQuery = vi.fn() as any;
      mockJQuery.ui = {};
      mockJQuery.fn = { fancytree: {} };
      (globalThis as any).$ = mockJQuery;
      (globalThis as any).jQuery = mockJQuery;
      const loadScriptSpy = vi.spyOn(service as any, 'loadScriptOnce').mockResolvedValue(undefined);
      const customElementsMock = { get: vi.fn().mockReturnValue(class {}) };
      globalThis.customElements = customElementsMock as any;
      await service.initializeDependencies();
      const wcCalls = loadScriptSpy.mock.calls.filter((call: any) => call[0]?.includes('sunbird-collection-editor.js'));
      expect(wcCalls.length).toBe(0);
    });
  });
  describe('loadAssets', () => {
    it('loads stylesheet on first call', () => {
      const loadAssets = (service as any).loadAssets.bind(service);
      loadAssets();
      const styleLink = document.querySelector('[data-collection-editor-styles]') as HTMLLinkElement;
      expect(styleLink).toBeTruthy();
      expect(styleLink.rel).toBe('stylesheet');
      expect(styleLink.href).toContain('/assets/collection-editor/styles.css');
    });
    it('does not reload stylesheet on subsequent calls', () => {
      const loadAssets = (service as any).loadAssets.bind(service);
      loadAssets();
      const firstCall = document.querySelectorAll('[data-collection-editor-styles]').length;
      loadAssets();
      const secondCall = document.querySelectorAll('[data-collection-editor-styles]').length;
      expect(firstCall).toBe(1);
      expect(secondCall).toBe(1);
    });
    it('sets stylesLoaded flag', () => {
      const loadAssets = (service as any).loadAssets.bind(service);
      expect((CollectionEditorService as any).stylesLoaded).toBe(false);
      loadAssets();
      expect((CollectionEditorService as any).stylesLoaded).toBe(true);
    });
  });
});
