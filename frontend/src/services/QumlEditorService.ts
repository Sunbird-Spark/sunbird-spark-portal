import { getClient } from '../lib/http-client';
import userAuthInfoService from './userAuthInfoService/userAuthInfoService';
import appCoreService from './AppCoreService';
import { OrganizationService } from './OrganizationService';
import { UserService } from './UserService';

export interface EditorConfig {
  context: {
    identifier: string;
    channel: string;
    sid: string;
    did: string;
    uid: string;
    user: {
      firstName: string;
      lastName: string;
      fullName: string;
      userName: string;
    };
    host: string;
    pdata: {
      id: string;
      ver: string;
      pid: string;
    };
    contextRollup: Record<string, any>;
    cdata: any[];
    objectRollup: Record<string, any>;
    endpoint: string;
    timeDiff: number;
  };
  config: {
    mode: 'edit' | 'review' | 'read';
    primaryCategory: string;
    objectType: string;
    showAddCollaborator: boolean;
    questionSet: {
      maxQuestionsLimit: number;
    };
  };
}

export interface QuestionSetMetadata {
  identifier: string;
  name: string;
  description?: string;
  primaryCategory: string;
  objectType: string;
  status: string;
  createdBy: string;
  channel: string;
  framework?: string;
  mimeType: string;
}

export interface QumlEditorContextOverrides extends Partial<EditorConfig['context']> {}

export interface QumlEditorInitOptions {
  mode?: EditorConfig['config']['mode'];
  contextOverrides?: QumlEditorContextOverrides;
}

export interface QumlEditorEvent {
  type: string;
  data: any;
  editorId: string;
  timestamp: number;
}

export class QumlEditorService {
  private static stylesLoaded = false;

  private orgService = new OrganizationService();
  private userService = new UserService();

  private eventHandlers = new WeakMap<HTMLElement, {
    editor?: (event: Event) => void;
    telemetry?: (event: Event) => void;
  }>();

  /**
   * Get questionset metadata for editing
   */
  async getQuestionSet<T = any>(questionSetId: string): Promise<T> {
    const res = await getClient().get<unknown>(`/questionset/v2/read/${questionSetId}?mode=edit`);
    return res.data as T;
  }

  /**
   * Create editor configuration object similar to player context generation
   */
  async createEditorConfig(metadata: QuestionSetMetadata, mode?: EditorConfig['config']['mode']): Promise<EditorConfig> {
    const sid = userAuthInfoService.getSessionId() || '';
    const uid = userAuthInfoService.getUserId() || '';

    let did = '';
    try {
      did = await appCoreService.getDeviceId();
    } catch (error) {
      console.warn('Failed to fetch device ID:', error);
    }

    let channel = '';
    try {
      const orgResponse = await this.orgService.search({ filters: { isTenant: true } });
      const org = orgResponse?.data?.result?.response?.content?.[0];
      if (org?.channel) {
        channel = org.channel;
      }
    } catch (error) {
      console.warn('Failed to fetch channel from org service:', error);
    }

    const pdata = await appCoreService.getPData();
    const user = await this.fetchUserInfo(uid);

    const host = '';
    const endpoint = '';

    return {
      context: {
        identifier: metadata.identifier,
        channel,
        sid,
        did,
        uid,
        user,
        host,
        pdata,
        contextRollup: { l1: channel },
        cdata: [],
        objectRollup: {},
        endpoint,
        timeDiff: 0,
      },
      config: {
        mode: mode || 'edit',
        primaryCategory: metadata.primaryCategory,
        objectType: metadata.objectType,
        showAddCollaborator: false,
        questionSet: {
          maxQuestionsLimit: 500,
        },
      },
    };
  }

  /**
   * Create editor config with optional context overrides and explicit mode
   */
  async createConfig(
    metadata: QuestionSetMetadata,
    options?: QumlEditorInitOptions
  ): Promise<EditorConfig> {
    const baseConfig = await this.createEditorConfig(metadata, options?.mode);
    const context = {
      ...baseConfig.context,
      ...(options?.contextOverrides || {}),
    };

    const config = {
      ...baseConfig.config,
      ...(options?.mode ? { mode: options.mode } : {}),
    };
    return {
      ...baseConfig,
      context,
      config,
    };
  }

  private async fetchUserInfo(uid: string): Promise<{ firstName: string; lastName: string; fullName: string; userName: string }> {
    const defaults = { firstName: '', lastName: '', fullName: '', userName: '' };
    if (!uid || uid === 'anonymous') {
      return defaults;
    }

    try {
      const response = await this.userService.userRead(uid);
      const profile = response?.data?.response;
      const firstName = profile?.firstName || '';
      const lastName = profile?.lastName || '';
      const userName = profile?.userName || '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || userName || '';
      return { firstName, lastName, fullName, userName };
    } catch (error) {
      console.warn('Failed to fetch user info for editor context:', error);
      return defaults;
    }
  }

  /**
   * Load QUML editor styles dynamically (only once)
   */
  private loadStyles(): void {
    const existingStyles = document.querySelector('[data-quml-editor-styles="true"]');
    if (existingStyles || QumlEditorService.stylesLoaded) {
      QumlEditorService.stylesLoaded = true;
      return;
    }

    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = '/assets/quml-editor/styles.css';
    styleLink.setAttribute('data-quml-editor-styles', 'true');
    document.head.appendChild(styleLink);

    QumlEditorService.stylesLoaded = true;
  }

  /**
   * Create QUML editor web component element with config attached
   */
  createElement(config: EditorConfig): HTMLElement {
    this.loadStyles();

    const element = document.createElement('lib-questionset-editor');
    element.setAttribute('editor-config', JSON.stringify(config));
    element.setAttribute('data-editor-id', config.context.identifier);
    return element;
  }

  /**
   * Attach editor / telemetry events
   */
  attachEventListeners(
    element: HTMLElement,
    onEditorEvent?: (event: QumlEditorEvent) => void,
    onTelemetryEvent?: (event: any) => void,
  ): void {
    this.removeEventListeners(element);
    const editorHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail || {};
      const editorEvent: QumlEditorEvent = {
        type: detail.action || detail.type || 'unknown',
        data: detail,
        editorId: element.getAttribute('data-editor-id') || 'quml-editor',
        timestamp: Date.now(),
      };
      onEditorEvent?.(editorEvent);
    };
    const telemetryHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      onTelemetryEvent?.(customEvent.detail);
    };
    element.addEventListener('editorEmitter', editorHandler);
    element.addEventListener('telemetryEvent', telemetryHandler);
    this.eventHandlers.set(element, {
      editor: editorHandler,
      telemetry: telemetryHandler,
    });
  }

  /**
   * Cleanup attached handlers
   */
  removeEventListeners(element: HTMLElement | null): void {
    if (!element) return;
    const handlers = this.eventHandlers.get(element);
    if (handlers) {
      if (handlers.editor) {
        element.removeEventListener('editorEmitter', handlers.editor);
      }
      if (handlers.telemetry) {
        element.removeEventListener('telemetryEvent', handlers.telemetry);
      }
      this.eventHandlers.delete(element);
    }
  }
}
export const qumlEditorService = new QumlEditorService();
