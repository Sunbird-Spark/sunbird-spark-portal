import '../jquery-setup'; // Must be first - sets up jQuery globally
import 'jquery-ui-dist/jquery-ui';
import { CollectionEditorConfig, CollectionEditorContextProps, CollectionEditorEvent } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';

export class CollectionEditorService {
    private eventHandlers = new WeakMap<HTMLElement, { editor: (event: Event) => void; telemetry?: (event: Event) => void }>();
    private orgService = new OrganizationService();
    private static stylesLoaded = false;
    private static scriptLoaded = false;
    private static scriptLoading?: Promise<void>;
    private static dependenciesLoaded = false;
    private static dependenciesLoading?: Promise<void>;

    private loadScript(): Promise<void> {
        if (CollectionEditorService.scriptLoaded || customElements.get('lib-editor')) {
            CollectionEditorService.scriptLoaded = true;
            return Promise.resolve();
        }
        if (CollectionEditorService.scriptLoading) {
            return CollectionEditorService.scriptLoading;
        }
        CollectionEditorService.scriptLoading = new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = '/assets/collection-editor/sunbird-collection-editor.js';
            script.setAttribute('data-collection-editor-script', 'true');
            script.onload = () => { CollectionEditorService.scriptLoaded = true; CollectionEditorService.scriptLoading = undefined; resolve(); };
            script.onerror = () => { CollectionEditorService.scriptLoading = undefined; reject(new Error('Failed to load sunbird-collection-editor script')); };
            document.body.appendChild(script);
        });
        return CollectionEditorService.scriptLoading;
    }

    async initializeDependencies(): Promise<void> {
        // Return early if already loaded
        if (CollectionEditorService.dependenciesLoaded) {
            return;
        }

        // If loading is in progress, wait for it to complete
        if (CollectionEditorService.dependenciesLoading) {
            return CollectionEditorService.dependenciesLoading;
        }

        // Create loading promise to prevent concurrent initialization
        CollectionEditorService.dependenciesLoading = (async () => {
            try {
                await this.loadScript();
                const $global = (globalThis as any).$;

                // jQuery and jQuery UI are loaded via static imports at the top
                // Now load FancyTree with ALL extensions from npm module
                if (!$global.fn?.fancytree) {
                    // Import the full FancyTree bundle with all extensions (glyph, table, etc.)
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
                CollectionEditorService.dependenciesLoaded = true;
            } catch (error) {
                // Reset loading promise on failure so retry is possible
                CollectionEditorService.dependenciesLoading = undefined;
                throw error;
            }
        })();

        return CollectionEditorService.dependenciesLoading;
    }

    async createConfig(
        metadata: any,
        contextProps: CollectionEditorContextProps
    ): Promise<CollectionEditorConfig> {
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
            const orgResponse = await this.orgService.search({
                filters: { isTenant: true }
            });
            const org = orgResponse?.data?.response?.content?.[0];
            if (org) {
                channel = org.channel;
            }
        } catch (error) {
            console.warn('Failed to fetch channel info:', error);
        }

        const pdata = await appCoreService.getPData();
        const context = {
            identifier: metadata.identifier,
            mode: contextProps?.mode || 'edit',
            sid,
            did,
            uid,
            channel,
            pdata,
            contextRollup: contextProps?.contextRollup || { l1: channel },
            cdata: contextProps?.cdata || [],
            timeDiff: 0,
            objectRollup: contextProps?.objectRollup || {},
            host: '',
            endpoint: '',
            user: {
                id: uid,
                orgIds: [channel],
            }
        };

        return {
            context,
            config: {
                showAddCollaborator: true,
                mode: contextProps?.mode || 'edit',
                objectType: contextProps?.objectType || 'Collection',
                primaryCategory: contextProps?.primaryCategory || 'Content Playlist',
            },
            metadata,
        };
    }

    private loadAssets(): void {
        if (CollectionEditorService.stylesLoaded) return;

        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/assets/collection-editor/styles.css';
        styleLink.setAttribute('data-collection-editor-styles', 'true');
        document.head.appendChild(styleLink);

        CollectionEditorService.stylesLoaded = true;
    }

    createElement(config: CollectionEditorConfig): HTMLElement {
        const element = document.createElement('lib-editor');
        element.setAttribute('editor-config', JSON.stringify(config));
        return element;
    }

    attachEventListeners(
        element: HTMLElement,
        onEditorEvent?: (event: CollectionEditorEvent) => void,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onTelemetryEvent?: (event: any) => void
    ): void {
        this.removeEventListeners(element);

        const editorHandler = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (onEditorEvent) {
                onEditorEvent({
                    type: 'editorEmitter',
                    data: customEvent.detail
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
