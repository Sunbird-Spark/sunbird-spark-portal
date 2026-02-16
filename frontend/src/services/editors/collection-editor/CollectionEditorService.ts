import { CollectionEditorConfig, CollectionEditorContextProps, CollectionEditorEvent } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';

export class CollectionEditorService {
    private eventHandlers = new WeakMap<HTMLElement, { editor: (event: Event) => void; telemetry?: (event: Event) => void }>();
    private orgService = new OrganizationService();
    private static stylesLoaded = false;
    private static dependenciesLoaded = false;

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
        if (CollectionEditorService.dependenciesLoaded) {
            console.log('[CollectionEditor] Dependencies already loaded, skipping initialization');
            return;
        }

        console.log('[CollectionEditor] Starting dependency initialization...');

        // 1. Ensure reflect-metadata is available
        if (!(globalThis as any).Reflect?.getMetadata) {
            console.log('[CollectionEditor] Loading reflect-metadata...');
            await import('reflect-metadata');
        }

        // 2. Ensure jQuery is present
        if (!(globalThis as any).$ || !(globalThis as any).jQuery) {
            console.log('[CollectionEditor] Loading jQuery...');
            const { default: jq } = await import('jquery');
            (globalThis as any).$ = jq;
            (globalThis as any).jQuery = jq;
        }

        const $global = (globalThis as any).$;
        (globalThis as any).jQuery = $global;

        // 3. Load jQuery UI from CDN and wait for it to be available
        if (!$global.ui) {
            console.log('[CollectionEditor] Loading jQuery UI from CDN...');
            await this.loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js');
            
            // Poll for jQuery UI to be available (max 5 seconds)
            const startTime = Date.now();
            while (!$global.ui && Date.now() - startTime < 5000) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            if (!$global.ui) {
                throw new Error('jQuery UI failed to load after 5 seconds; required for FancyTree');
            }
            console.log('[CollectionEditor] jQuery UI loaded successfully');
        }

        // 4. Load FancyTree from CDN (instead of module imports to avoid timing issues)
        if (!$global.fn?.fancytree) {
            console.log('[CollectionEditor] Loading FancyTree from CDN...');
            await this.loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jquery.fancytree/2.38.3/jquery.fancytree-all.min.js');
            
            // Poll for FancyTree to be available (max 5 seconds)
            const startTime = Date.now();
            while (!$global.fn?.fancytree && Date.now() - startTime < 5000) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            if (!$global.fn?.fancytree) {
                throw new Error('FancyTree failed to load after 5 seconds');
            }
            console.log('[CollectionEditor] FancyTree loaded successfully');
        }

        // 5. Load the Collection Editor Web Component Script
        if (!customElements.get('lib-editor')) {
            console.log('[CollectionEditor] Loading collection editor web component...');
            await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = '/assets/collection-editor/sunbird-collection-editor.js';
                script.async = true;
                script.onload = () => {
                    console.log('[CollectionEditor] Web component script loaded');
                    resolve();
                };
                script.onerror = (err) => {
                    console.error('[CollectionEditor] Failed to load web component script', err);
                    reject(err);
                };
                document.body.appendChild(script);
            }).catch((error) => {
                console.warn('Collection editor web component script not found at /assets/collection-editor/sunbird-collection-editor.js', error);
            });
        }

        this.loadAssets();
        CollectionEditorService.dependenciesLoaded = true;
        console.log('[CollectionEditor] All dependencies loaded successfully');
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
            const org = orgResponse?.data?.result?.response?.content?.[0];
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
                mode: contextProps?.mode,
                maxDepth: 4,
                objectType: 'Collection',
                primaryCategory: 'Content Playlist',
            },
            metadata,
        };
    }

    private loadAssets(): void {
        if (CollectionEditorService.stylesLoaded) return;

        // Load styles
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/assets/collection-editor/styles.css';
        styleLink.setAttribute('data-collection-editor-styles', 'true');
        document.head.appendChild(styleLink);

        // Load script if not using standard import or if web component requires it
        // The web component usually registers itself when imported.
        // Use dynamic import or script tag if needed. 
        // Assuming the package import in the component handles registration.

        CollectionEditorService.stylesLoaded = true;
    }

    createElement(config: CollectionEditorConfig): HTMLElement {
        this.loadAssets();

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
            console.log("On editorEmitter", customEvent);
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
