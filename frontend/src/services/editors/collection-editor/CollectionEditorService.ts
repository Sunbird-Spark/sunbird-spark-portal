import jQuery from '../jquery-setup'; // Must be first - sets up jQuery globally
import 'jquery-ui-dist/jquery-ui';
import { CollectionEditorConfig, CollectionEditorContextProps, CollectionEditorEvent } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';
import { ChannelService } from '../../ChannelService';
import userProfileService from '../../UserProfileService';
import { getClient } from '../../../lib/http-client';

export class CollectionEditorService {
    private eventHandlers = new WeakMap<HTMLElement, { editor: (event: Event) => void; telemetry?: (event: Event) => void }>();
    private orgService = new OrganizationService();
    private channelService = new ChannelService();
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
            const userChannel = await userProfileService.getChannel();
            if (userChannel) filters.slug = userChannel;
            const orgResponse = await this.orgService.search({ filters });
            const org = orgResponse?.data?.response?.content?.[0];
            if (org) {
                channel = org.hashTagId || org.identifier;
            }
        } catch (error) {
            console.warn('Failed to fetch channel info:', error);
        }

        let framework = '';
        let channelData: any = {};
        if (channel) {
            try {
                const channelResponse = await this.channelService.read(channel);
                channelData = (channelResponse as any)?.data?.channel || {};
                const frameworks = channelData?.frameworks;
                if (Array.isArray(frameworks) && frameworks.length > 0) {
                    framework = frameworks[0]?.identifier || '';
                }
            } catch (error) {
                console.warn('Failed to fetch channel framework:', error);
            }
        }

        let hierarchyConfig: Record<string, any> = {};
        try {
            hierarchyConfig = await this.fetchHierarchyConfig(metadata, channel, channelData);
        } catch (error) {
            console.warn('Failed to fetch hierarchy config:', error);
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
                ...hierarchyConfig,
            },
            metadata,
        };
    }

    private async fetchHierarchyConfig(
        metadata: any,
        channel: string,
        channelData: any
    ): Promise<Record<string, any>> {
        const objectType = metadata.mimeType === 'application/vnd.sunbird.questionset' ? 'QuestionSet' : 'Collection';
        const primaryCategory = metadata.primaryCategory || '';

        if (!channel || !primaryCategory) {
            return {};
        }

        const categoryResponse = await getClient().get('/object/category/definition/v1/read/obj-cat:course_collection_all?fields=objectMetadata,forms');

        const config = (categoryResponse as any)?.data?.objectCategoryDefinition?.objectMetadata?.config;
        if (!config) {
            return {};
        }

        const hierarchyConfig: Record<string, any> = { ...(config?.sourcingSettings?.collection || {}) };

        if (hierarchyConfig.children && Object.keys(hierarchyConfig.children).length > 0) {
            hierarchyConfig.children = this.getPrimaryCategoryData(hierarchyConfig.children, channelData);
        }

        if (hierarchyConfig.hierarchy && Object.keys(hierarchyConfig.hierarchy).length > 0) {
            Object.values(hierarchyConfig.hierarchy as Record<string, any>).forEach((hierarchyValue: any) => {
                if (hierarchyValue?.children) {
                    hierarchyValue.children = this.getPrimaryCategoryData(hierarchyValue.children, channelData);
                }
            });
        }

        return hierarchyConfig;
    }

    private getPrimaryCategoryData(
        childrenData: Record<string, any>,
        channelData: any
    ): Record<string, any> {
        const result = { ...childrenData };
        Object.keys(result).forEach((key) => {
            if (!result[key] || (Array.isArray(result[key]) && result[key].length === 0)) {
                switch (key) {
                    case 'Question':
                        result[key] = channelData.questionPrimaryCategories || [];
                        break;
                    case 'Content':
                        result[key] = channelData.contentPrimaryCategories || [];
                        break;
                    case 'Collection':
                        result[key] = channelData.collectionPrimaryCategories || [];
                        break;
                    case 'QuestionSet':
                        result[key] = channelData.questionsetPrimaryCategories || [];
                        break;
                }
            }
        });
        return result;
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