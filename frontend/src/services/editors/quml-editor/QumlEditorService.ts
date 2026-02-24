import jQuery from '../jquery-setup'; // Must be first - sets up jQuery globally
import 'jquery-ui-dist/jquery-ui';
import { QumlEditorConfig, QumlEditorContextOverrides, QumlEditorEvent, QuestionSetMetadata } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';
import { SystemSettingService } from '../../SystemSettingService';

export class QumlEditorService {
  private static stylesLoaded = false;
  private static scriptLoaded = false;
  private static scriptLoading?: Promise<void>;
  private static dependenciesLoaded = false;
  private static dependenciesLoading?: Promise<void>;
  private static fancytreeJQueryRef: any;
  private systemSettingService = new SystemSettingService();

  private orgService = new OrganizationService();
  private eventHandlers = new WeakMap<HTMLElement, {
    editor: (event: Event) => void;
    telemetry?: (event: Event) => void;
  }>();

  private getGlobalJQuery(): any {
    return (globalThis as any).$ || (globalThis as any).jQuery;
  }

  private setGlobalJQuery(jq: any): void {
    if (!jq) return;
    (globalThis as any).$ = jq;
    (globalThis as any).jQuery = jq;
  }

  private captureFancyTreeJQueryRef(): void {
    const jq = this.getGlobalJQuery();
    if (jq?.fn?.fancytree) {
      QumlEditorService.fancytreeJQueryRef = jq;
    }
  }

  private restoreFancytreeJQuery(): void {
    const jqCurrent = this.getGlobalJQuery();
    if (jqCurrent?.fn?.fancytree) {
      QumlEditorService.fancytreeJQueryRef = jqCurrent;
      return;
    }

    if (QumlEditorService.fancytreeJQueryRef?.fn?.fancytree) {
      this.setGlobalJQuery(QumlEditorService.fancytreeJQueryRef);
    }
  }

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
      (window as any).CKEDITOR_VERSION = undefined;
      script.src = '/assets/quml-editor/sunbird-questionset-editor.js';
      script.setAttribute('data-quml-editor-script', 'true');
      script.onload = () => {
        QumlEditorService.scriptLoaded = true;
        QumlEditorService.scriptLoading = undefined;
        resolve();
      };
      script.onerror = () => {
        QumlEditorService.scriptLoading = undefined;
        reject(new Error('Failed to load sunbird-questionset-editor script'));
      };
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
        const jq = this.getGlobalJQuery() || jQuery;
        this.setGlobalJQuery(jq);

        // jQuery and jQuery UI are now loaded via static imports
        // Load FancyTree modules from npm
        if (!jq?.fn?.fancytree) {
          // Load all FancyTree modules in sequence
          await import('jquery.fancytree/dist/modules/jquery.fancytree.ui-deps');
          await import('jquery.fancytree/dist/modules/jquery.fancytree');
          await import('jquery.fancytree/dist/modules/jquery.fancytree.dnd5');
          await import('jquery.fancytree/dist/modules/jquery.fancytree.edit');
          await import('jquery.fancytree/dist/modules/jquery.fancytree.filter');
          await import('jquery.fancytree/dist/modules/jquery.fancytree.glyph');
          await import('jquery.fancytree/dist/modules/jquery.fancytree.table');
        }

        // Verify FancyTree attached to the active global jQuery.
        this.captureFancyTreeJQueryRef();
        if (!QumlEditorService.fancytreeJQueryRef?.fn?.fancytree) {
          throw new Error('FancyTree failed to attach to jQuery');
        }

        await this.loadScript();

        // Questionset editor bundle can overwrite global jQuery; restore FancyTree-capable instance.
        this.restoreFancytreeJQuery();
        this.captureFancyTreeJQueryRef();
        if (!QumlEditorService.fancytreeJQueryRef?.fn?.fancytree) {
          throw new Error('FancyTree became unavailable after loading questionset editor script');
        }

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
      const filters: Record<string, any> = { isTenant: true };
      try {
        const settingResponse = await this.systemSettingService.read('default_channel');
        const slugValue = (settingResponse as any)?.data?.response?.value;
        if (slugValue) {
          filters.slug = slugValue;
        }
      } catch (err) {
        console.warn('Failed to fetch default channel system setting:', err);
      }
      const orgResponse = await this.orgService.search({ filters });
      const org = orgResponse?.data?.response?.content?.[0];
      if (org) {
        channel = org.hashTagId || org.identifier;
      }
    } catch (error) {
      console.warn('Failed to fetch channel info:', error);
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

  loadAssets(): void {
    if (QumlEditorService.stylesLoaded) return;

    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = '/assets/quml-editor/styles.css';
    styleLink.setAttribute('data-quml-editor-styles', 'true');
    document.head.appendChild(styleLink);

    QumlEditorService.stylesLoaded = true;
  }

  removeAssets(): void {
    const link = document.querySelector('link[data-quml-editor-styles]');
    if (link) {
      link.remove();
    }
    QumlEditorService.stylesLoaded = false;
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