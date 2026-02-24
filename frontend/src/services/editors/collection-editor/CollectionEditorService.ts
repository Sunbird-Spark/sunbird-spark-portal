import jQuery from '../jquery-setup'; // Must be first - sets up jQuery globally
import 'jquery-ui-dist/jquery-ui';
import { CollectionEditorConfig, CollectionEditorContextProps, CollectionEditorEvent } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';
import { ChannelService } from '../../ChannelService';
import { SystemSettingService } from '../../SystemSettingService';

export class CollectionEditorService {
    private eventHandlers = new WeakMap<HTMLElement, { editor: (event: Event) => void; telemetry?: (event: Event) => void }>();
    private orgService = new OrganizationService();
    private channelService = new ChannelService();
    private systemSettingService = new SystemSettingService();
    private static stylesLoaded = false;
    private static scriptLoaded = false;
    private static scriptLoading?: Promise<void>;
    private static dependenciesLoaded = false;
    private static dependenciesLoading?: Promise<void>;
    private static fancytreeJQueryRef: any;

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
            CollectionEditorService.fancytreeJQueryRef = jq;
        }
    }

    getFancytreeJQueryRef(): any {
        return CollectionEditorService.fancytreeJQueryRef;
    }

    restoreFancytreeJQuery(): void {
        const jqCurrent = this.getGlobalJQuery();
        if (jqCurrent?.fn?.fancytree) {
            CollectionEditorService.fancytreeJQueryRef = jqCurrent;
            return;
        }

        if (CollectionEditorService.fancytreeJQueryRef?.fn?.fancytree) {
            this.setGlobalJQuery(CollectionEditorService.fancytreeJQueryRef);
        }
    }

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
            (window as any).CKEDITOR_VERSION = undefined;
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
                const jq = this.getGlobalJQuery() || jQuery;
                this.setGlobalJQuery(jq);

                // jQuery and jQuery UI are loaded via static imports at the top
                // Now load FancyTree with ALL extensions from npm module
                if (!jq?.fn?.fancytree) {
                    // Import the full FancyTree bundle with all extensions (glyph, table, etc.)
                    await import('jquery.fancytree/dist/modules/jquery.fancytree.ui-deps');
                    await import('jquery.fancytree/dist/modules/jquery.fancytree');
                    await import('jquery.fancytree/dist/modules/jquery.fancytree.dnd5');
                    await import('jquery.fancytree/dist/modules/jquery.fancytree.edit');
                    await import('jquery.fancytree/dist/modules/jquery.fancytree.filter');
                    await import('jquery.fancytree/dist/modules/jquery.fancytree.glyph');
                    await import('jquery.fancytree/dist/modules/jquery.fancytree.table');
                }

                // Verify FancyTree attached to the active global jQuery
                this.captureFancyTreeJQueryRef();
                if (!CollectionEditorService.fancytreeJQueryRef?.fn?.fancytree) {
                    throw new Error('FancyTree failed to attach to jQuery');
                }

                await this.loadScript();

                // The editor bundle may overwrite global $/jQuery; restore FancyTree-capable instance if needed.
                this.restoreFancytreeJQuery();
                this.captureFancyTreeJQueryRef();
                if (!CollectionEditorService.fancytreeJQueryRef?.fn?.fancytree) {
                    throw new Error('FancyTree became unavailable after loading collection editor script');
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

        let framework = '';
        if (channel) {
            try {
                const channelResponse = await this.channelService.read(channel);
                const frameworks = (channelResponse as any)?.data?.channel?.frameworks;
                if (Array.isArray(frameworks) && frameworks.length > 0) {
                    framework = frameworks[0]?.identifier || '';
                }
            } catch (error) {
                console.warn('Failed to fetch channel framework:', error);
            }
        }

        const pdata = await appCoreService.getPData();
        const context = {
            identifier: metadata.identifier,
            mode: contextProps?.mode || 'edit',
            sid,
            did,
            uid,
            channel,
            framework,
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

    loadAssets(): void {
        if (CollectionEditorService.stylesLoaded) return;

        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/assets/collection-editor/styles.css';
        styleLink.setAttribute('data-collection-editor-styles', 'true');
        document.head.appendChild(styleLink);

        CollectionEditorService.stylesLoaded = true;
    }

    removeAssets(): void {
        const link = document.querySelector('link[data-collection-editor-styles]');
        if (link) link.remove();
        CollectionEditorService.stylesLoaded = false;
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