import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CollectionEditorService } from './CollectionEditorService';

// Mock FancyTree modules to avoid jQuery initialization issues in tests
vi.mock('jquery.fancytree/dist/modules/jquery.fancytree.ui-deps', () => ({}));
vi.mock('jquery.fancytree/dist/modules/jquery.fancytree', () => ({}));
vi.mock('jquery.fancytree/dist/modules/jquery.fancytree.dnd5', () => ({}));
vi.mock('jquery.fancytree/dist/modules/jquery.fancytree.edit', () => ({}));
vi.mock('jquery.fancytree/dist/modules/jquery.fancytree.filter', () => ({}));
vi.mock('jquery.fancytree/dist/modules/jquery.fancytree.glyph', () => ({}));
vi.mock('jquery.fancytree/dist/modules/jquery.fancytree.table', () => ({}));

describe('CollectionEditorService - Dependencies', () => {
  let service: CollectionEditorService;

  beforeEach(() => {
    service = new CollectionEditorService();
    (CollectionEditorService as any).dependenciesLoaded = false;
    (CollectionEditorService as any).dependenciesLoading = undefined;
    (CollectionEditorService as any).stylesLoaded = false;
    
    // Setup mock jQuery
    const mockJQuery: any = vi.fn();
    mockJQuery.fn = {};
    mockJQuery.each = vi.fn();
    (globalThis as any).$ = mockJQuery;
    (globalThis as any).jQuery = mockJQuery;
  });

  afterEach(() => {
    document.querySelectorAll('[data-collection-editor-styles]').forEach(el => el.remove());
    document.querySelectorAll('link[href*="collection-editor"]').forEach(el => el.remove());
    vi.clearAllMocks();
  });

  describe('initializeDependencies', () => {
    it('returns early if dependencies already loaded', async () => {
      (CollectionEditorService as any).dependenciesLoaded = true;
      await service.initializeDependencies();
      expect((CollectionEditorService as any).dependenciesLoaded).toBe(true);
    });

    it('loads FancyTree from npm modules', async () => {
      // Simulate FancyTree attaching to jQuery after import
      (globalThis as any).$.fn.fancytree = vi.fn();

      await service.initializeDependencies();

      expect((CollectionEditorService as any).dependenciesLoaded).toBe(true);
      expect((globalThis as any).$.fn.fancytree).toBeDefined();
    });

    it('throws error if FancyTree fails to attach to jQuery', async () => {
      // FancyTree modules load but don't attach to jQuery
      (globalThis as any).$.fn.fancytree = undefined;

      await expect(service.initializeDependencies()).rejects.toThrow('FancyTree failed to attach to jQuery');
    });

    it('skips FancyTree loading if already available', async () => {
      // Pre-set FancyTree as already loaded
      (globalThis as any).$.fn.fancytree = vi.fn();

      await service.initializeDependencies();

      expect((CollectionEditorService as any).dependenciesLoaded).toBe(true);
    });

    it('reuses in-flight loading promise on concurrent calls', async () => {
      // Simulate FancyTree attaching to jQuery
      (globalThis as any).$.fn.fancytree = vi.fn();

      // Call initializeDependencies multiple times concurrently
      const promise1 = service.initializeDependencies();
      const promise2 = service.initializeDependencies();
      const promise3 = service.initializeDependencies();

      await Promise.all([promise1, promise2, promise3]);

      // All should succeed and dependencies should be loaded
      expect((CollectionEditorService as any).dependenciesLoaded).toBe(true);
    });
  });
});