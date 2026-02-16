import { QumlEditorConfig, QumlEditorContextOverrides, QumlEditorEvent, QuestionSetMetadata } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';
import { getClient } from '@/lib/http-client';

export class QumlEditorService {
  private static stylesLoaded = false;
  private static dependenciesLoaded = false;

  private orgService = new OrganizationService();
  private eventHandlers = new WeakMap<HTMLElement, {
    editor: (event: Event) => void;
    telemetry?: (event: Event) => void;
  }>();

  async getQuestionSet<T = any>(questionSetId: string): Promise<T> {
    const res = await getClient().get<unknown>(`/questionset/v2/read/${questionSetId}?mode=edit`);
    return res.data as T;
  }
  private async loadScriptOnce(url: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[data-src="${url}"]`);
      if (existing) {
        if ((existing as HTMLScriptElement).dataset.loaded === 'true') {
          resolve();
          return;
        }
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', (e) => reject(e), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.dataset.src = url;
      script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = (e) => reject(e);
      document.body.appendChild(script);
    });
  }

  async initializeDependencies(): Promise<void> {
    if (QumlEditorService.dependenciesLoaded) {
      return;
    }

    // 1. Load jQuery from npm package
    if (!(globalThis as any).$ || !(globalThis as any).jQuery) {
      const { default: jq } = await import('jquery');
      (globalThis as any).$ = jq;
      (globalThis as any).jQuery = jq;
    }

    const $global = (globalThis as any).$;

    // 2. Load jQuery UI from CDN - MUST be loaded via script tag and confirmed ready
    //    before any FancyTree module import because bundled modules check $.ui at initialization time
    if (!$global.ui) {
      await this.loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js');
      
      // Wait for jQuery UI to be available (max 5 seconds)
      const startTime = Date.now();
      while (!$global.ui && Date.now() - startTime < 5000) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!$global.ui) {
        throw new Error('jQuery UI failed to load; required for FancyTree');
      }
    }

    // 3. Load FancyTree from CDN - Cannot use npm package because:
    //    - Module imports execute immediately when bundle loads
    //    - FancyTree checks for $.ui during module initialization
    //    - Timing race: bundle may load before jQuery UI script registers $.ui
    //    - CDN script loading ensures sequential execution and proper $.ui availability
    if (!$global.fn?.fancytree) {
      await this.loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jquery.fancytree/2.38.3/jquery.fancytree-all.min.js');
      
      // Wait for FancyTree to be available (max 5 seconds)
      const startTime = Date.now();
      while (!$global.fn?.fancytree && Date.now() - startTime < 5000) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!$global.fn?.fancytree) {
        throw new Error('FancyTree failed to load');
      }
    }

    QumlEditorService.dependenciesLoaded = true;
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
      const org = orgResponse?.data?.result?.response?.content?.[0] || orgResponse?.data?.response?.content?.[0];
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
    this.loadAssets();

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
export const qumlEditorService = new QumlEditorService();
