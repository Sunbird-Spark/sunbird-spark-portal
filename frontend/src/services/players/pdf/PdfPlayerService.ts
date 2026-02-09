import { PdfPlayerConfig, PdfPlayerOptions, PdfPlayerEvent, PdfTelemetryEvent } from '../types';
import { SunbirdPdfPlayerConfig } from './types';

/**
 * Service for initializing and managing the PDF Player.
 * Handles player creation, configuration, and event management.
 */
export class PdfPlayerService {
    private eventHandlers = new WeakMap<HTMLElement, { playerHandler: (event: Event) => void; telemetryHandler: (event: Event) => void }>();
    private static readonly DEFAULT_OPTIONS: Required<PdfPlayerOptions> = {
        showShare: true,
        showDownload: true,
        showPrint: true,
        showReplay: true,
        showExit: false,
    };
    private static readonly DEFAULT_CONTEXT = {
        mode: "play",
        authToken: "",
        channel: "portal",
        pdata: {
            id: "sunbird.portal",
            ver: "1.0.0",
            pid: "sunbird-portal.contentplayer"
        },
        contextRollup: {
            l1: "portal"
        },
        tags: [] as string[],
        cdata: [] as any[],
        timeDiff: 0,
        objectRollup: {},
        endpoint: "",
        userData: {
            firstName: "Guest",
            lastName: "User"
        }
    };
    private static readonly DEFAULT_METADATA = {
        compatibilityLevel: 4,
        pkgVersion: 1,
    };

    getDefaultOptions(): PdfPlayerOptions {
        return { ...PdfPlayerService.DEFAULT_OPTIONS };
    }
    private getMergedOptions(customOptions?: PdfPlayerOptions): Required<PdfPlayerOptions> {
        return {
            ...PdfPlayerService.DEFAULT_OPTIONS,
            ...customOptions,
        };
    }
    createElement(config: PdfPlayerConfig, options?: PdfPlayerOptions): HTMLElement {

        // Merge options with defaults
        const mergedOptions = this.getMergedOptions(options);
        const sunbirdConfig = this.createSunbirdConfig(config, mergedOptions);

        const element = document.createElement('sunbird-pdf-player');
        element.setAttribute('player-config', JSON.stringify(sunbirdConfig));
        element.setAttribute('data-player-id', config.contentId);

        return element;
    }

    /**
     * Attach event listeners to the player element
     */
    attachEventListeners(
        element: HTMLElement,
        onPlayerEvent?: (event: PdfPlayerEvent) => void,
        onTelemetryEvent?: (event: PdfTelemetryEvent) => void
    ): void {
        const playerHandler = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (onPlayerEvent) {
                const pdfEvent: PdfPlayerEvent = {
                    ...customEvent.detail,
                    playerId: element.getAttribute('data-player-id') || 'pdf-player',
                    timestamp: Date.now()
                };
                onPlayerEvent(pdfEvent);
            }
        };

        const telemetryHandler = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (onTelemetryEvent) {
                const pdfEvent: PdfTelemetryEvent = {
                    ...customEvent.detail,
                    playerId: element.getAttribute('data-player-id') || 'pdf-player',
                    timestamp: Date.now()
                };
                onTelemetryEvent(pdfEvent);
            }
        };

        element.addEventListener('playerEvent', playerHandler);
        element.addEventListener('telemetryEvent', telemetryHandler);

        // Store handlers for cleanup
        this.eventHandlers.set(element, { playerHandler, telemetryHandler });
    }

    /**
     * Remove event listeners from the player element
     */
    removeEventListeners(element: HTMLElement): void {
        const handlers = this.eventHandlers.get(element);
        if (handlers) {
            element.removeEventListener('playerEvent', handlers.playerHandler);
            element.removeEventListener('telemetryEvent', handlers.telemetryHandler);
            this.eventHandlers.delete(element);
        }
    }

    /**
     * Create Sunbird-specific configuration from generic config
     * Merges defaults with provided values
     */
    private createSunbirdConfig(
        config: PdfPlayerConfig,
        options: Required<PdfPlayerOptions>
    ): SunbirdPdfPlayerConfig {
        return {
            context: {
                ...PdfPlayerService.DEFAULT_CONTEXT,
                // Use provided session/device IDs or empty string
                sid: config.sid || "",
                did: config.did || "",
                // Override with user-provided values if available
                uid: config.userId || "anonymous",
                authToken: config.userToken || "",
                host: window.location.origin,
                ...config.context,
            },
            config: {
                sideMenu: {
                    showShare: options.showShare,
                    showDownload: options.showDownload,
                    showReplay: options.showReplay,
                    showExit: options.showExit,
                    showPrint: options.showPrint,
                }
            },
            metadata: {
                ...PdfPlayerService.DEFAULT_METADATA,
                // Required fields from config
                identifier: config.contentId,
                name: config.contentName,
                artifactUrl: config.contentUrl,
                streamingUrl: config.streamingUrl || config.contentUrl,
                // Optional fields that override defaults if provided
                compatibilityLevel: config.compatibilityLevel || PdfPlayerService.DEFAULT_METADATA.compatibilityLevel,
                pkgVersion: config.pkgVersion || PdfPlayerService.DEFAULT_METADATA.pkgVersion,
                isAvailableLocally: config.isAvailableLocally,
                basePath: config.basePath,
                baseDir: config.baseDir,
                ...config.metadata
            }
        };
    }

    /**
     * Get the default configuration template
     * Useful for documentation or testing
     */
    getDefaultConfigTemplate(): Partial<SunbirdPdfPlayerConfig> {
        return {
            context: {
                ...PdfPlayerService.DEFAULT_CONTEXT,
                sid: "",
                did: "",
                uid: "anonymous",
                host: window.location.origin,
            },
            config: {
                sideMenu: { ...PdfPlayerService.DEFAULT_OPTIONS }
            },
            metadata: {
                ...PdfPlayerService.DEFAULT_METADATA,
                identifier: '',
                name: '',
                artifactUrl: ''
            },
        };
    }
}