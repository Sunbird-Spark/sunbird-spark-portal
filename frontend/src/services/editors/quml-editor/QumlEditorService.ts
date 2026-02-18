import '../jquery-setup'; // Must be first - sets up jQuery globally
import 'jquery-ui-dist/jquery-ui';
import { QumlEditorConfig, QumlEditorContextOverrides, QumlEditorEvent, QuestionSetMetadata } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';

export class QumlEditorService {
  private static stylesLoaded = false;
  private static scriptLoaded = false;
  private static scriptLoading?: Promise<void>;
  private static dependenciesLoaded = false;
  private static dependenciesLoading?: Promise<void>;

  private orgService = new OrganizationService();
  private eventHandlers = new WeakMap<HTMLElement, {
    editor: (event: Event) => void;
    telemetry?: (event: Event) => void;
  }>();

  private loadScript(): Promise<void> {
    if (QumlEditorService.scriptLoaded || customElements.get('lib-questionset-editor')) {
      QumlEditorService.scriptLoaded = true;
      return Promise.resolve();
    }
    if (QumlEditorService.scriptLoading) {
      return QumlEditorService.scriptLoading;
    }
    QumlEditorService.scriptLoading = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/assets/quml-editor/sunbird-questionset-editor.js';
      script.setAttribute('data-quml-editor-script', 'true');
      script.onload = () => { QumlEditorService.scriptLoaded = true; QumlEditorService.scriptLoading = undefined; resolve(); };
      script.onerror = () => { QumlEditorService.scriptLoading = undefined; reject(new Error('Failed to load sunbird-questionset-editor script')); };
      document.body.appendChild(script);
    });
    return QumlEditorService.scriptLoading;
  }

  async initializeDependencies(): Promise<void> {
    // Return early if already loaded
    if (QumlEditorService.dependenciesLoaded) {
      return;
    }

    // If loading is in progress, wait for it to complete
    if (QumlEditorService.dependenciesLoading) {
      return QumlEditorService.dependenciesLoading;
    }

    // Create loading promise to prevent concurrent initialization
    QumlEditorService.dependenciesLoading = (async () => {
      try {
        await this.loadScript();
        const $global = (globalThis as any).$;

        // jQuery and jQuery UI are now loaded via static imports
        // Load FancyTree modules from npm
        if (!$global.fn?.fancytree) {
          // Load all FancyTree modules in sequence
          await import('jquery.fancytree/dist/modules/jquery.fancytree.ui-deps');
          await import('jquery.fancytree/dist/modules/jquery.fancytree');
          await import('jquery.fancytree/dist/modules/jquery.fancytree.dnd5');
          await import('jquery.fancytree/dist/modules/jquery.fancytree.edit');
          await import('jquery.fancytree/dist/modules/jquery.fancytree.filter');
          await import('jquery.fancytree/dist/modules/jquery.fancytree.glyph');
          await import('jquery.fancytree/dist/modules/jquery.fancytree.table');

          // Verify FancyTree attached to jQuery
          if (!$global.fn?.fancytree) {
            throw new Error('FancyTree failed to attach to jQuery');
          }
        }

        this.loadAssets();
        QumlEditorService.dependenciesLoaded = true;
      } catch (error) {
        // Reset loading promise on failure so retry is possible
        QumlEditorService.dependenciesLoading = undefined;
        throw error;
      }
    })();

    return QumlEditorService.dependenciesLoading;
  }

  async createConfig(
    metadata: QuestionSetMetadata,
    contextOverrides?: QumlEditorContextOverrides
  ): Promise<QumlEditorConfig> {
    const sid = userAuthInfoService.getSessionId() || '';
    const uid = userAuthInfoService.getUserId() || 'anonymous';

    let did = '';
    try {
      did = await appCoreService.getDeviceId();
    } catch (error) {
      console.warn('Failed to fetch device ID:', error);
    }

    let channel = '';
    try {
      const orgResponse = await this.orgService.search({ filters: { isTenant: true } });
      const org = orgResponse?.data?.response?.content?.[0];
      if (org?.channel) {
        channel = org.channel;
      }
    } catch (error) {
      console.warn('Failed to fetch channel from org service:', error);
    }

    const pdata = await appCoreService.getPData();
    const mode = contextOverrides?.mode || 'edit';

    const context = {
      identifier: metadata.identifier,
      mode,
      sid,
      did,
      uid,
      channel,
      pdata,
      contextRollup: contextOverrides?.contextRollup || { l1: channel },
      cdata: contextOverrides?.cdata || [],
      objectRollup: contextOverrides?.objectRollup || {},
      host: '',
      endpoint: '',
      timeDiff: 0,
      user: {
        id: uid,
        orgIds: [channel],
      },
    };

    return {
      context,
      config: {
        apiSlug: '/portal',
        mode,
        primaryCategory: metadata.primaryCategory,
        objectType: metadata.objectType,
        showAddCollaborator: false,
        questionSet: {
          maxQuestionsLimit: 500,
        },
      },
      metadata,
    };
  }

  private loadAssets(): void {
    if (QumlEditorService.stylesLoaded) return;

    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = '/assets/quml-editor/styles.css';
    styleLink.setAttribute('data-quml-editor-styles', 'true');
    document.head.appendChild(styleLink);

    QumlEditorService.stylesLoaded = true;
  }

  createElement(config: QumlEditorConfig): HTMLElement {
    const element = document.createElement('lib-questionset-editor');
    element.setAttribute('editor-config', JSON.stringify(config));
    return element;
  }

  attachEventListeners(
    element: HTMLElement,
    onEditorEvent?: (event: QumlEditorEvent) => void,
    onTelemetryEvent?: (event: any) => void
  ): void {
    this.removeEventListeners(element);

    const editorHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (onEditorEvent) {
        onEditorEvent({
          type: 'editorEmitter',
          data: customEvent.detail,
        });
      }
    };

    const telemetryHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      onTelemetryEvent?.(customEvent.detail);
    };

    element.addEventListener('editorEmitter', editorHandler);
    element.addEventListener('telemetryEvent', telemetryHandler);
    this.eventHandlers.set(element, { editor: editorHandler, telemetry: telemetryHandler });
  }

  removeEventListeners(element: HTMLElement): void {
    const handlers = this.eventHandlers.get(element);
    if (handlers) {
      element.removeEventListener('editorEmitter', handlers.editor);
      if (handlers.telemetry) {
        element.removeEventListener('telemetryEvent', handlers.telemetry);
      }
      this.eventHandlers.delete(element);
    }
  }
}
