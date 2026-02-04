import { PdfPlayerConfig, PdfPlayerOptions, PdfPlayerEvent, PdfTelemetryEvent } from '../types';
import { SunbirdPdfPlayerConfig } from './types';

/**
 * Default configuration for the PDF Player
 * These can be overridden by passing custom values through props
 */
export class ContentPlayerService {
    private eventHandlers = new WeakMap<HTMLElement, { playerHandler: EventListener; telemetryHandler: EventListener }>();

    /**
     * Default player options
     */
    private static readonly DEFAULT_OPTIONS: Required<PdfPlayerOptions> = {
        showShare: true,
        showDownload: true,
        showPrint: true,
        showReplay: true,
        showExit: false,
    };

    /**
     * Default context configuration for telemetry
     */
    private static readonly DEFAULT_CONTEXT = {
        mode: "play" as const,
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

    /**
     * Default metadata configuration
     */
    private static readonly DEFAULT_METADATA = {
        compatibilityLevel: 4,
        pkgVersion: 1,
    };

    /**
     * Get default player options
     */
    getDefaultOptions(): PdfPlayerOptions {
        return { ...ContentPlayerService.DEFAULT_OPTIONS };
    }

    /**
     * Get merged options (defaults + custom)
     */
    private getMergedOptions(customOptions?: PdfPlayerOptions): Required<PdfPlayerOptions> {
        return {
            ...ContentPlayerService.DEFAULT_OPTIONS,
            ...customOptions,
        };
    }

    /**
     * Creates a PDF player element with merged configuration
     * @param config - Player configuration (required fields)
     * @param options - Optional UI options (merged with defaults)
     */
    createElement(config: PdfPlayerConfig, options?: PdfPlayerOptions): HTMLElement {
        if (!this.validateConfig(config)) {
            throw new Error('Invalid PDF player configuration');
        }

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
     * Validate the player configuration
     */
    validateConfig(config: PdfPlayerConfig): boolean {
        return !!(
            config.contentId &&
            config.contentName &&
            config.contentUrl &&
            config.contentUrl.toLowerCase().includes('.pdf')
        );
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
                ...ContentPlayerService.DEFAULT_CONTEXT,
                // Generate unique session/device IDs
                sid: crypto.randomUUID(),
                did: crypto.randomUUID(),
                // Override with user-provided values if available
                uid: config.userId || "anonymous",
                authToken: config.userToken || "",
                host: window.location.origin,
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
                ...ContentPlayerService.DEFAULT_METADATA,
                // Required fields from config
                identifier: config.contentId,
                name: config.contentName,
                artifactUrl: config.contentUrl,
                streamingUrl: config.streamingUrl || config.contentUrl,
                // Optional fields that override defaults if provided
                compatibilityLevel: config.compatibilityLevel || ContentPlayerService.DEFAULT_METADATA.compatibilityLevel,
                pkgVersion: config.pkgVersion || ContentPlayerService.DEFAULT_METADATA.pkgVersion,
                isAvailableLocally: config.isAvailableLocally,
                basePath: config.basePath,
                baseDir: config.baseDir,
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
                ...ContentPlayerService.DEFAULT_CONTEXT,
                sid: crypto.randomUUID(),
                did: crypto.randomUUID(),
                uid: "anonymous",
                host: window.location.origin,
            },
            config: {
                sideMenu: { ...ContentPlayerService.DEFAULT_OPTIONS }
            },
            metadata: {
                ...ContentPlayerService.DEFAULT_METADATA,
                identifier: '',
                name: '',
                artifactUrl: ''
            },
        };
    }
}
