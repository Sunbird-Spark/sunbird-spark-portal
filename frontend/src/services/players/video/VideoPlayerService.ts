import { VideoPlayerConfig, VideoPlayerEvent, VideoPlayerContextProps, VideoPlayerMetadata } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';

/**
 * Service for initializing and managing the Video Player.
 * Handles player creation, configuration, and event management.
 * 
 * Style Loading Strategy:
 * - Video player styles are loaded dynamically when the first player is created
 * - This prevents unnecessary CSS loading if no video player is used on the page
 * - Styles are loaded globally as the web component requires them in the document scope
 */
export class VideoPlayerService {
  private eventHandlers = new WeakMap<
    HTMLElement,
    { player: (event: Event) => void; telemetry: (event: Event) => void }
  >();
  private orgService = new OrganizationService();
  private static stylesLoaded = false;
  private static scriptLoaded = false;
  private static scriptLoading?: Promise<void>;

  private loadScript(): Promise<void> {
    if (VideoPlayerService.scriptLoaded || customElements.get('sunbird-video-player')) {
      VideoPlayerService.scriptLoaded = true;
      return Promise.resolve();
    }
    if (VideoPlayerService.scriptLoading) {
      return VideoPlayerService.scriptLoading;
    }
    VideoPlayerService.scriptLoading = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/assets/video-player/sunbird-video-player.js';
      script.setAttribute('data-video-player-script', 'true');
      script.onload = () => { VideoPlayerService.scriptLoaded = true; VideoPlayerService.scriptLoading = undefined; resolve(); };
      script.onerror = () => { VideoPlayerService.scriptLoading = undefined; reject(new Error('Failed to load sunbird-video-player script')); };
      document.body.appendChild(script);
    });
    return VideoPlayerService.scriptLoading;
  }

  static unloadStyles(): void {
    const styleLink = document.querySelector('[data-video-player-styles="true"]');
    if (styleLink) {
      styleLink.remove();
    }
    VideoPlayerService.stylesLoaded = false;
  }

  /**
   * Create video player configuration with context props and metadata
   * @param metadata - Content metadata from backend
   * @param contextProps - Optional context properties (mode, cdata, contextRollup, objectRollup)
   */
  async createConfig(
    metadata: VideoPlayerMetadata,
    contextProps?: VideoPlayerContextProps
  ): Promise<VideoPlayerConfig> {
    await this.loadScript();
    // Get session and user info from auth service
    const sid = userAuthInfoService.getSessionId() || `session-${Date.now()}`;
    const uid = userAuthInfoService.getUserId() || 'anonymous';

    // Get device ID from AppCoreService (backend) with fallback
    let did = '';
    try {
      did = await appCoreService.getDeviceId();
    } catch (error) {
      console.warn('Failed to fetch device ID, using fallback:', error);
    }

    // Get channel from org service with random fallback for testing
    let channel = '' 
    try {
      const orgResponse = await this.orgService.search({
        filters: {
          isTenant: true
        }
      });
      const org = orgResponse?.data?.result?.response?.content?.[0];
      if (org?.channel) {
        channel = org.channel;
        console.log('Using channel from org service:', channel);
      } else {
        console.warn('Channel not found from org service, using random fallback:', channel);
      }
    } catch (error) {
      console.warn('Failed to fetch channel from org service, using random fallback:', channel);
    }

    // Build context with defaults and overrides
    const context = {
      mode: contextProps?.mode || 'play',
      sid,
      did,
      uid,
      channel,
      pdata: {
        id: 'sunbird.portal',
        ver: '3.2.12',
        pid: 'sunbird-portal.contentplayer',
      },
      contextRollup: contextProps?.contextRollup || {
        l1: channel,
      },
      cdata: contextProps?.cdata || [],
      timeDiff: 0,
      objectRollup: contextProps?.objectRollup || {},
      host: '',
      endpoint: '',
      userData: {
        firstName: 'Guest',
        lastName: '',
      }
    };

    const finalConfig = {
      context,
      config: {},
      metadata,
    };

    return finalConfig;
  }

  /**
   * Load video player styles dynamically (only once)
   * Checks for existing style element to prevent race conditions
   */
  private loadStyles(): void {
    // Check if styles already exist in the DOM (prevents race conditions)
    const existingStyles = document.querySelector('[data-video-player-styles="true"]');
    if (existingStyles || VideoPlayerService.stylesLoaded) {
      VideoPlayerService.stylesLoaded = true;
      return;
    }

    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = '/assets/video-player/styles.css';
    styleLink.setAttribute('data-video-player-styles', 'true');
    document.head.appendChild(styleLink);
    VideoPlayerService.stylesLoaded = true;
  }

  /**
   * Create video player element with configuration
   * Styles are loaded dynamically on first use
   */
  createElement(config: VideoPlayerConfig): HTMLElement {
    // Load styles if not already loaded
    this.loadStyles();

    const element = document.createElement('sunbird-video-player');
    const configString = JSON.stringify(config);

    element.setAttribute('player-config', configString);
    element.setAttribute('data-player-id', config.metadata.identifier);

    return element;
  }

  /**
   * Attach event listeners to the player element
   */
  attachEventListeners(
    element: HTMLElement,
    onPlayerEvent?: (event: VideoPlayerEvent) => void,
    onTelemetryEvent?: (event: any) => void
  ): void {
    // Remove any existing handler first to prevent memory leaks
    this.removeEventListeners(element);

    const playerHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (onPlayerEvent) {
        const videoEvent: VideoPlayerEvent = {
          type: customEvent.detail?.eid || 'unknown',
          data: customEvent.detail,
          playerId: element.getAttribute('data-player-id') || 'video-player',
          timestamp: Date.now(),
        };
        onPlayerEvent(videoEvent);
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
}
