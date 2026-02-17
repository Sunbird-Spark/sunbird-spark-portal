import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QumlEditorService, type QuestionSetMetadata } from './';
import appCoreService from '../../AppCoreService';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';

vi.mock('../../userAuthInfoService/userAuthInfoService');

// Mock all FancyTree modules
vi.mock('jquery.fancytree/dist/modules/jquery.fancytree.ui-deps', () => ({}));
vi.mock('jquery.fancytree/dist/modules/jquery.fancytree', () => ({}));
vi.mock('jquery.fancytree/dist/modules/jquery.fancytree.dnd5', () => ({}));
vi.mock('jquery.fancytree/dist/modules/jquery.fancytree.edit', () => ({}));
vi.mock('jquery.fancytree/dist/modules/jquery.fancytree.filter', () => ({}));
vi.mock('jquery.fancytree/dist/modules/jquery.fancytree.glyph', () => ({}));
vi.mock('jquery.fancytree/dist/modules/jquery.fancytree.table', () => ({}));

describe('QumlEditorService - Dependencies & Element Creation', () => {
  let service: QumlEditorService;

  beforeEach(() => {
    service = new QumlEditorService();
    (QumlEditorService as any).dependenciesLoaded = false;
    (QumlEditorService as any).dependenciesLoading = undefined;
    
    // Setup jQuery mock with .each method to prevent FancyTree initialization errors
    const mockJQuery: any = { fn: {}, ui: {}, each: vi.fn() };
    (globalThis as any).$ = mockJQuery;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeDependencies', () => {
    it('returns early if dependencies already loaded', async () => {
      (QumlEditorService as any).dependenciesLoaded = true;
      await service.initializeDependencies();
      expect((QumlEditorService as any).dependenciesLoaded).toBe(true);
    });

    it('loads FancyTree from npm modules', async () => {
      // Set fancytree after module imports to simulate successful loading
      (globalThis as any).$.fn.fancytree = vi.fn();
      
      await service.initializeDependencies();
      expect((QumlEditorService as any).dependenciesLoaded).toBe(true);
    });

    it('throws error if FancyTree fails to attach to jQuery', async () => {
      // Don't set $.fn.fancytree to simulate failure
      (globalThis as any).$ = { fn: {}, ui: {}, each: vi.fn() };
      
      await expect(service.initializeDependencies()).rejects.toThrow('FancyTree failed to attach to jQuery');
    });

    it('skips loading if already loaded', async () => {
      (globalThis as any).$.fn.fancytree = vi.fn();
      await service.initializeDependencies();
      
      const firstLoadState = (QumlEditorService as any).dependenciesLoaded;
      
      await service.initializeDependencies();
      
      expect((QumlEditorService as any).dependenciesLoaded).toBe(firstLoadState);
    });

    it('waits for in-flight loading promise', async () => {
      const service1 = new QumlEditorService();
      const service2 = new QumlEditorService();

      (globalThis as any).$.fn.fancytree = vi.fn();

      const promise1 = service1.initializeDependencies();
      const promise2 = service2.initializeDependencies();

      await Promise.all([promise1, promise2]);

      expect((QumlEditorService as any).dependenciesLoaded).toBe(true);
    });
  });


  describe('createElement', () => {
    beforeEach(() => {
      // Mock document methods for createElement tests
      document.createElement = vi.fn().mockImplementation((tag) => ({
        setAttribute: vi.fn(),
        removeEventListener: vi.fn(),
        addEventListener: vi.fn(),
        tagName: tag.toUpperCase(),
      })) as any;
      document.head.appendChild = vi.fn();
    });

    it('creates lib-questionset-editor element', () => {
      const service = new QumlEditorService();
      const mockConfig: any = {
        context: { identifier: 'do_123' },
        config: { mode: 'edit' as const },
        metadata: {} as any,
      };

      const element = service.createElement(mockConfig);

      expect(document.createElement).toHaveBeenCalledWith('lib-questionset-editor');
      expect(element.setAttribute).toHaveBeenCalledWith('editor-config', JSON.stringify(mockConfig));
    });

    it('loads styles only once', () => {
      const service = new QumlEditorService();
      const mockConfig: any = {
        context: { identifier: 'do_123' },
        config: { mode: 'edit' as const },
        metadata: {} as any,
      };

      service.createElement(mockConfig);
      const firstCallCount = (document.head.appendChild as any).mock.calls.length;

      service.createElement(mockConfig);
      const secondCallCount = (document.head.appendChild as any).mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount);
    });
  });

  describe('Event Listeners', () => {
    it('attaches editor and telemetry event listeners', () => {
      const service = new QumlEditorService();
      const mockElement = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as any;

      const onEditorEvent = vi.fn();
      const onTelemetryEvent = vi.fn();

      service.attachEventListeners(mockElement, onEditorEvent, onTelemetryEvent);

      expect(mockElement.addEventListener).toHaveBeenCalledWith('editorEmitter', expect.any(Function));
      expect(mockElement.addEventListener).toHaveBeenCalledWith('telemetryEvent', expect.any(Function));
    });

    it('removes existing listeners before attaching new ones', () => {
      const service = new QumlEditorService();
      const mockElement = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as any;

      service.attachEventListeners(mockElement, vi.fn());
      service.attachEventListeners(mockElement, vi.fn());

      expect(mockElement.removeEventListener).toHaveBeenCalled();
    });

    it('removes event listeners correctly', () => {
      const service = new QumlEditorService();
      const mockElement = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as any;

      service.attachEventListeners(mockElement, vi.fn(), vi.fn());
      service.removeEventListeners(mockElement);

      expect(mockElement.removeEventListener).toHaveBeenCalledWith('editorEmitter', expect.any(Function));
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('telemetryEvent', expect.any(Function));
    });
  });

  describe('createConfig - Error Handling', () => {
    it('handles device ID fetch failure', async () => {
      const service = new QumlEditorService();
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.mocked(userAuthInfoService.getSessionId).mockReturnValue('session-1');
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-1');
      vi.spyOn(appCoreService, 'getDeviceId').mockRejectedValue(new Error('Device error'));
      vi.spyOn(appCoreService, 'getPData').mockResolvedValue({ id: 'sunbird.portal', ver: '1.0', pid: 'portal' });
      vi.spyOn<any, any>(service['orgService'], 'search').mockResolvedValue({
        data: { response: { content: [{ channel: 'test' }] } },
      });

      const metadata = { identifier: 'do_123' } as QuestionSetMetadata;
      const config = await service.createConfig(metadata);

      expect(config.context.did).toBe('');
      expect(consoleWarn).toHaveBeenCalledWith('Failed to fetch device ID:', expect.any(Error));

      consoleWarn.mockRestore();
    });

    it('handles org service failure', async () => {
      const service = new QumlEditorService();
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.mocked(userAuthInfoService.getSessionId).mockReturnValue('session-1');
      vi.mocked(userAuthInfoService.getUserId).mockReturnValue('user-1');
      vi.spyOn(appCoreService, 'getDeviceId').mockResolvedValue('device-1');
      vi.spyOn(appCoreService, 'getPData').mockResolvedValue({ id: 'sunbird.portal', ver: '1.0', pid: 'portal' });
      vi.spyOn<any, any>(service['orgService'], 'search').mockRejectedValue(new Error('Org error'));

      const metadata = { identifier: 'do_123', primaryCategory: 'QuestionSet', objectType: 'QuestionSet' } as QuestionSetMetadata;
      const config = await service.createConfig(metadata);

      expect(config.context.channel).toBe('');
      expect(consoleWarn).toHaveBeenCalledWith('Failed to fetch channel from org service:', expect.any(Error));

      consoleWarn.mockRestore();
    });
  });
});
