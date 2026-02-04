import { PdfPlayerConfig, PdfPlayerOptions, PdfPlayerEvent, PdfTelemetryEvent } from '../types';
import { SunbirdPdfPlayerConfig } from './types';

export class PdfPlayerService {
  private eventHandlers = new WeakMap<HTMLElement, { playerHandler: EventListener; telemetryHandler: EventListener }>();

  createElement(config: PdfPlayerConfig, options: PdfPlayerOptions = {}): HTMLElement {
    if (!this.validateConfig(config)) {
      throw new Error('Invalid PDF player configuration');
    }

    const sunbirdConfig = this.createSunbirdConfig(config, options);

    const element = document.createElement('sunbird-pdf-player');
    element.setAttribute('player-config', JSON.stringify(sunbirdConfig));
    element.setAttribute('data-player-id', config.contentId);

    return element;
  }

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

  removeEventListeners(element: HTMLElement): void {
    const handlers = this.eventHandlers.get(element);
    if (handlers) {
      element.removeEventListener('playerEvent', handlers.playerHandler);
      element.removeEventListener('telemetryEvent', handlers.telemetryHandler);
      this.eventHandlers.delete(element);
    }
  }

  validateConfig(config: PdfPlayerConfig): boolean {
    return !!(
      config.contentId &&
      config.contentName &&
      config.contentUrl &&
      config.contentUrl.toLowerCase().includes('.pdf')
    );
  }

  private createSunbirdConfig(config: PdfPlayerConfig, options: PdfPlayerOptions): SunbirdPdfPlayerConfig {
    return {
      context: {
        mode: "play",
        authToken: config.userToken || "",
        sid: crypto.randomUUID(),
        did: crypto.randomUUID(),
        uid: config.userId || "anonymous",
        channel: "portal",
        pdata: {
          id: "sunbird.portal",
          ver: "1.0.0",
          pid: "sunbird-portal.contentplayer"
        },
        contextRollup: {
          l1: "portal"
        },
        tags: [],
        cdata: [],
        timeDiff: 0,
        objectRollup: {},
        host: window.location.origin,
        endpoint: "",
        userData: {
          firstName: "Guest",
          lastName: "User"
        }
      },
      config: {
        sideMenu: {
          showShare: options.showShare ?? true,
          showDownload: options.showDownload ?? true,
          showReplay: options.showReplay ?? true,
          showExit: options.showExit ?? false,
          showPrint: options.showPrint ?? true
        }
      },
      metadata: {
        identifier: config.contentId,
        name: config.contentName,
        artifactUrl: config.contentUrl,
        streamingUrl: config.streamingUrl || config.contentUrl,
        compatibilityLevel: config.compatibilityLevel || 4,
        pkgVersion: config.pkgVersion || 1,
        isAvailableLocally: config.isAvailableLocally,
        basePath: config.basePath,
        baseDir: config.baseDir
      }
    };
  }
}