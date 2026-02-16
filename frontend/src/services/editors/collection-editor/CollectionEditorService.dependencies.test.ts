import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CollectionEditorService } from './CollectionEditorService';

describe('CollectionEditorService - Dependencies', () => {
  let service: CollectionEditorService;

  beforeEach(() => {
    service = new CollectionEditorService();
    (CollectionEditorService as any).dependenciesLoaded = false;
    (CollectionEditorService as any).dependenciesLoading = undefined;
    (CollectionEditorService as any).stylesLoaded = false;
  });

  afterEach(() => {
    document.querySelectorAll('script[src*="fancytree"]').forEach(el => el.remove());
    document.querySelectorAll('script[src*="collection-editor"]').forEach(el => el.remove());
    document.querySelectorAll('[data-collection-editor-styles]').forEach(el => el.remove());
    document.querySelectorAll('link[href*="collection-editor"]').forEach(el => el.remove());
    vi.clearAllMocks();
  });

  describe('initializeDependencies', () => {
    it('returns early if dependencies already loaded', async () => {
      (CollectionEditorService as any).dependenciesLoaded = true;
      await service.initializeDependencies();
      // Should not create any new script tags
      expect(document.querySelectorAll('script[src*="fancytree"]').length).toBe(0);
    });

    it('loads FancyTree from self-hosted assets', async () => {
      const mockAppendChild: any = vi.fn((node: any) => {
        setTimeout(() => {
          if (node.tagName === 'SCRIPT' && node.onload) {
            // Simulate FancyTree attaching to jQuery
            (globalThis as any).$.fn.fancytree = vi.fn();
            node.onload(new Event('load'));
          }
        }, 5);
        return node;
      });
      vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);

      const mockJQuery: any = vi.fn();
      mockJQuery.fn = {};
      (globalThis as any).$ = mockJQuery;
      (globalThis as any).jQuery = mockJQuery;

      const customElementsMock = { get: vi.fn().mockReturnValue(undefined) };
      globalThis.customElements = customElementsMock as any;

      await service.initializeDependencies();

      const scriptCall = mockAppendChild.mock.calls.find((call: any) =>
        call[0].src?.includes('fancytree')
      );
      expect(scriptCall).toBeDefined();
      expect(scriptCall[0].src).toContain('/assets/fancytree/jquery.fancytree-all-deps.min.js');
    });

    it('loads collection editor web component', async () => {
      const mockAppendChild: any = vi.fn((node: any) => {
        setTimeout(() => {
          if (node.tagName === 'SCRIPT' && node.onload) {
            if (node.src.includes('fancytree')) {
              (globalThis as any).$.fn.fancytree = vi.fn();
            }
            node.onload(new Event('load'));
          }
        }, 5);
        return node;
      });
      vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);

      const mockJQuery: any = vi.fn();
      mockJQuery.fn = {};
      (globalThis as any).$ = mockJQuery;
      (globalThis as any).jQuery = mockJQuery;

      const customElementsMock = { get: vi.fn().mockReturnValue(undefined) };
      globalThis.customElements = customElementsMock as any;

      await service.initializeDependencies();

      const webComponentCall = mockAppendChild.mock.calls.find((call: any) =>
        call[0].src?.includes('sunbird-collection-editor.js')
      );
      expect(webComponentCall).toBeDefined();
      expect(webComponentCall[0].src).toContain('/assets/collection-editor/sunbird-collection-editor.js');
    });

    it('skips FancyTree loading if already available', async () => {
      const mockAppendChild: any = vi.fn((node: any) => {
        setTimeout(() => {
          if (node.tagName === 'SCRIPT' && node.onload) {
            node.onload(new Event('load'));
          }
        }, 5);
        return node;
      });
      vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);

      const mockJQuery: any = vi.fn();
      mockJQuery.fn = { fancytree: vi.fn() };
      (globalThis as any).$ = mockJQuery;
      (globalThis as any).jQuery = mockJQuery;

      const customElementsMock = { get: vi.fn().mockReturnValue(undefined) };
      globalThis.customElements = customElementsMock as any;

      await service.initializeDependencies();

      const fancytreeCall = mockAppendChild.mock.calls.find((call: any) =>
        call[0].src?.includes('fancytree')
      );
      expect(fancytreeCall).toBeUndefined();
    });

    it('skips web component loading if already registered', async () => {
      const mockAppendChild: any = vi.fn((node: any) => {
        setTimeout(() => {
          if (node.tagName === 'SCRIPT' && node.onload) {
            (globalThis as any).$.fn.fancytree = vi.fn();
            node.onload(new Event('load'));
          }
        }, 5);
        return node;
      });
      vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);

      const mockJQuery: any = vi.fn();
      mockJQuery.fn = {};
      (globalThis as any).$ = mockJQuery;
      (globalThis as any).jQuery = mockJQuery;

      const customElementsMock = { get: vi.fn().mockReturnValue(class {}) };
      globalThis.customElements = customElementsMock as any;

      await service.initializeDependencies();

      const webComponentCall = mockAppendChild.mock.calls.find((call: any) =>
        call[0].src?.includes('sunbird-collection-editor.js')
      );
      expect(webComponentCall).toBeUndefined();
    });

    it('reuses in-flight loading promise on concurrent calls', async () => {
      const mockAppendChild: any = vi.fn((node: any) => {
        setTimeout(() => {
          if (node.tagName === 'SCRIPT' && node.onload) {
            (globalThis as any).$.fn.fancytree = vi.fn();
            node.onload(new Event('load'));
          }
        }, 50); // Longer delay to test concurrency
        return node;
      });
      vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);

      const mockJQuery: any = vi.fn();
      mockJQuery.fn = {};
      (globalThis as any).$ = mockJQuery;
      (globalThis as any).jQuery = mockJQuery;

      const customElementsMock = { get: vi.fn().mockReturnValue(undefined) };
      globalThis.customElements = customElementsMock as any;

      // Call initializeDependencies multiple times concurrently
      const promise1 = service.initializeDependencies();
      const promise2 = service.initializeDependencies();
      const promise3 = service.initializeDependencies();

      await Promise.all([promise1, promise2, promise3]);

      // Should only append scripts once despite multiple concurrent calls
      const fancytreeCalls = mockAppendChild.mock.calls.filter((call: any) =>
        call[0].src?.includes('fancytree')
      );
      expect(fancytreeCalls.length).toBe(1);
    });
  });
});
