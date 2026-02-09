import { EpubPlayerConfig, EpubPlayerEvent } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';

/**
 * Service for initializing and managing the EPUB Player.
 * Handles player creation, configuration, and event management.
 */
export class EpubPlayerService {
  private eventHandlers = new WeakMap<HTMLElement, (event: Event) => void>();

  private static readonly DEFAULT_CONTEXT = {
    mode: 'play' as const,
    partner: [] as string[],
    pdata: {
      id: 'sunbird.portal',
      ver: '1.0',
      pid: 'sunbird-portal',
    },
    timeDiff: 0,
    channel: 'sunbird-portal',
    tags: [] as string[],
    contextRollup: {},
    objectRollup: {},
    endpoint: '',
  };

  private static readonly DEFAULT_CONFIG = {
    sideMenu: {
      showShare: false,
      showDownload: false,
      showReplay: false,
      showExit: false,
    },
  };

  private static readonly DEFAULT_METADATA = {
    streamingUrl: '',
    compatibilityLevel: 1,
    pkgVersion: 1,
  };

  /**
   * Creates a default player configuration
   * Automatically fetches sid and uid from the auth service if not provided
   */
  public static createDefaultConfig(
    contentId: string,
    contentName: string,
    epubUrl: string,
    userId?: string,
    sessionId?: string
  ): EpubPlayerConfig {
    // Get sid and uid from auth service if not provided
    const sid = sessionId || userAuthInfoService.getSessionId() || `session-${Date.now()}`;
    const uid = userId || userAuthInfoService.getUserId() || `anonymous`;

    return {
      context: {
        ...EpubPlayerService.DEFAULT_CONTEXT,
        contentId,
        sid,
        uid,
        did: `device-${Date.now()}`,
        host: window.location.origin,
      },
      config: {
        ...EpubPlayerService.DEFAULT_CONFIG,
      },
      metadata: {
        ...EpubPlayerService.DEFAULT_METADATA,
        identifier: contentId,
        name: contentName,
        artifactUrl: epubUrl,
      },
    };
  }

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
    onPlayerEvent?: (event: EpubPlayerEvent) => void
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

    element.addEventListener('playerEvent', playerHandler);
    
    // Store handler for cleanup
    this.eventHandlers.set(element, playerHandler);
  }

  /**
   * Remove event listeners from the player element
   */
  removeEventListeners(element: HTMLElement): void {
    const handler = this.eventHandlers.get(element);
    if (handler) {
      element.removeEventListener('playerEvent', handler);
      this.eventHandlers.delete(element);
    }
  }

  /**
   * Merges custom config with the artifact URL
   */
  public static mergeConfigWithUrl(
    baseConfig: Partial<EpubPlayerConfig>,
    epubUrl: string
  ): EpubPlayerConfig {
    return {
      ...baseConfig,
      metadata: {
        ...baseConfig.metadata,
        artifactUrl: epubUrl,
      },
    } as EpubPlayerConfig;
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
   * Handles player events and provides structured event data
   */
  public static handlePlayerEvent(event: any): EpubPlayerEvent {
    return {
      type: event?.eid || 'unknown',
      data: event,
    };
  }
}
