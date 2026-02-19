import type { QumlPlayerConfig, QumlPlayerEvent, QumlPlayerContextProps, QumlPlayerMetadata } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';

export class QumlPlayerService {
  private eventHandlers = new WeakMap<HTMLElement, { player: (event: Event) => void; telemetry: (event: Event) => void }>();
  private orgService = new OrganizationService();
  private static stylesLoaded = false;
  private static scriptLoaded = false;
  private static scriptLoading?: Promise<void>;

  private loadScript(): Promise<void> {
    if (QumlPlayerService.scriptLoaded || customElements.get('sunbird-quml-player')) {
      QumlPlayerService.scriptLoaded = true;
      return Promise.resolve();
    }
    if (QumlPlayerService.scriptLoading) {
      return QumlPlayerService.scriptLoading;
    }
    QumlPlayerService.scriptLoading = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/assets/quml-player/sunbird-quml-player.js';
      script.setAttribute('data-quml-player-script', 'true');
      script.onload = () => { QumlPlayerService.scriptLoaded = true; QumlPlayerService.scriptLoading = undefined; resolve(); };
      script.onerror = () => { QumlPlayerService.scriptLoading = undefined; reject(new Error('Failed to load sunbird-quml-player script')); };
      document.body.appendChild(script);
    });
    return QumlPlayerService.scriptLoading;
  }

  /**
   * Create QUML player configuration with context props and metadata
   * @param metadata - Content metadata from backend
   * @param contextProps - Optional context properties (mode, cdata, contextRollup, objectRollup)
   */
  async createConfig(
    metadata: QumlPlayerMetadata,
    contextProps?: QumlPlayerContextProps
  ): Promise<QumlPlayerConfig> {
    await this.loadScript();
    // Get session and user info from auth service
    const sid = userAuthInfoService.getSessionId() || `session-${Date.now()}`;
    const uid = userAuthInfoService.getUserId() || 'anonymous';

    // Get device ID from AppCoreService (backend)
    let did = '';
    try {
      did = await appCoreService.getDeviceId();
    } catch (error) {
      console.warn('Failed to fetch device ID:', error);
    }

    // Get channel from org service
    let channel = '';
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
        console.warn('Channel not found from org service');
      }
    } catch (error) {
      console.warn('Failed to fetch channel from org service:', error);
    }

    // Get pdata from app core service
    const pdata = await appCoreService.getPData();

    // Build context with defaults and overrides
    const context = {
      mode: contextProps?.mode || 'play',
      sid,
      did,
      uid,
      channel,
      pdata,
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
   * Load QUML player styles dynamically (only once)
   * Checks for existing style element to prevent race conditions
   */
  private loadStyles(): void {
    // Set question list URL for the web component
    (window as any).questionListUrl = '/action/question/v2/list';

    // Check if styles already exist in the DOM (prevents race conditions)
    const existingStyles = document.querySelector('[data-quml-player-styles="true"]');
    if (existingStyles || QumlPlayerService.stylesLoaded) {
      QumlPlayerService.stylesLoaded = true;
      return;
    }

    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = '/assets/quml-player/styles.css';
    styleLink.setAttribute('data-quml-player-styles', 'true');
    document.head.appendChild(styleLink);

    QumlPlayerService.stylesLoaded = true;
  }

  /**
   * Remove QUML player styles from the document head.
   * Called when the player component unmounts to prevent style bleed
   * into other pages during SPA navigation.
   */
  static unloadStyles(): void {
    const styleLink = document.querySelector('[data-quml-player-styles="true"]');
    if (styleLink) {
      styleLink.remove();
    }
    QumlPlayerService.stylesLoaded = false;
  }

  /**
   * Create QUML player element with configuration
   * Styles are loaded dynamically on first use
   */
  createElement(config: QumlPlayerConfig): HTMLElement {
    // Load styles if not already loaded
    this.loadStyles();

    const element = document.createElement('sunbird-quml-player');
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
    onPlayerEvent?: (event: QumlPlayerEvent) => void,
    onTelemetryEvent?: (event: any) => void
  ): void {
    // Remove any existing handler first to prevent memory leaks
    this.removeEventListeners(element);

    const playerHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (onPlayerEvent) {
        const qumlEvent: QumlPlayerEvent = {
          type: customEvent.detail?.eid || 'unknown',
          data: customEvent.detail,
          playerId: element.getAttribute('data-player-id') || 'quml-player',
          timestamp: Date.now(),
        };
        onPlayerEvent(qumlEvent);
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

export const qumlPlayerService = new QumlPlayerService();
