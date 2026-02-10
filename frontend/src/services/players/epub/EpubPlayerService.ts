import { EpubPlayerConfig, EpubPlayerEvent } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';

/**
 * Service for initializing and managing the EPUB Player.
 * Handles player creation, configuration, and event management.
 */
export class EpubPlayerService {
  private eventHandlers = new WeakMap<HTMLElement, { player: (event: Event) => void; telemetry: (event: Event) => void }>();

  /**
   * Create EPUB player element with configuration
   */
  createElement(config: EpubPlayerConfig): HTMLElement {
    const element = document.createElement('sunbird-epub-player');
    element.setAttribute('player-config', JSON.stringify(config));
    element.setAttribute('data-player-id', config.metadata.identifier);
    return element;
  }

  /**
   * Attach event listeners to the player element
   */
  attachEventListeners(
    element: HTMLElement,
    onPlayerEvent?: (event: EpubPlayerEvent) => void,
    onTelemetryEvent?: (event: any) => void
  ): void {
    // Remove any existing handler first to prevent memory leaks
    this.removeEventListeners(element);

    const playerHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (onPlayerEvent) {
        const epubEvent: EpubPlayerEvent = {
          type: customEvent.detail?.eid || 'unknown',
          data: customEvent.detail,
          playerId: element.getAttribute('data-player-id') || 'epub-player',
          timestamp: Date.now(),
        };
        onPlayerEvent(epubEvent);
      }
    };

    const telemetryHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (onTelemetryEvent) {
        onTelemetryEvent(customEvent.detail);
      }
    };

    element.addEventListener('playerEvent', playerHandler);
    element.addEventListener('telemetryEvent', telemetryHandler);
    
    // Store handlers for cleanup
    this.eventHandlers.set(element, { player: playerHandler, telemetry: telemetryHandler });
  }

  /**
   * Remove event listeners from the player element
   */
  removeEventListeners(element: HTMLElement): void {
    const handlers = this.eventHandlers.get(element);
    if (handlers) {
      element.removeEventListener('playerEvent', handlers.player);
      element.removeEventListener('telemetryEvent', handlers.telemetry);
      this.eventHandlers.delete(element);
    }
  }

  /**
   * Validates if the URL is a valid EPUB file
   */
  public static isValidEpubUrl(url: string): boolean {
    if (!url) return false;
    
    // Remove query parameters and fragments for validation
    const urlParts = url.split('?');
    const cleanUrl = urlParts[0]?.split('#')[0];
    
    if (!cleanUrl) return false;
    
    // Check if it ends with .epub (case insensitive)
    if (!cleanUrl.toLowerCase().endsWith('.epub')) {
      return false;
    }
    
    // If it starts with / or ./ it's a relative path - valid
    if (url.startsWith('/') || url.startsWith('./')) {
      return true;
    }
    
    // Otherwise, try to parse as full URL
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a default EPUB player configuration
   */
  public static createDefaultConfig(
    contentId: string,
    name: string,
    artifactUrl: string,
    uid?: string,
    sid?: string
  ): EpubPlayerConfig {
    const userId = uid || userAuthInfoService.getUserId() || 'anonymous';
    const sessionId = sid || userAuthInfoService.getSessionId() || `session-${Date.now()}`;
    const deviceId = `device-${Date.now()}`;

    return {
      context: {
        mode: 'play',
        partner: [],
        pdata: {
          id: 'sunbird.portal',
          ver: '1.0',
          pid: 'sunbird-portal',
        },
        contentId,
        sid: sessionId,
        uid: userId,
        did: deviceId,
        channel: 'sunbird-portal',
        tags: [],
        timeDiff: 0,
        host: window.location.origin,
        endpoint: '',
      },
      config: {
        sideMenu: {
          showShare: false,
          showDownload: false,
          showReplay: false,
          showExit: false,
        },
      },
      metadata: {
        identifier: contentId,
        name,
        artifactUrl,
        streamingUrl: '',
        compatibilityLevel: 1,
        pkgVersion: 1,
      },
    };
  }

  /**
   * Handle and structure player events
   */
  public static handlePlayerEvent(event: any): { type: string; data: any } {
    return {
      type: event?.eid || 'unknown',
      data: event,
    };
  }
}
