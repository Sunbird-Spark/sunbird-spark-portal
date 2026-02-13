import { PdfPlayerConfig, PdfPlayerEvent, PdfPlayerContextProps, PdfPlayerMetadata } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';

/**
 * Service for initializing and managing the PDF Player.
 * Handles player creation, configuration, and event management.
 */
export class PdfPlayerService {
  private eventHandlers = new WeakMap<HTMLElement, { player: (event: Event) => void; telemetry: (event: Event) => void }>();
  private orgService = new OrganizationService();

  /**
   * Create PDF player configuration with context props and metadata
   * @param metadata - Content metadata from backend
   * @param contextProps - Optional context properties (mode, cdata, contextRollup, objectRollup)
   */
  async createConfig(
    metadata: PdfPlayerMetadata,
    contextProps?: PdfPlayerContextProps
  ): Promise<PdfPlayerConfig> {
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
    let channel = ''; // Random fallback for testing
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
    };

    const finalConfig = {
      context,
      config: {},
      metadata,
    };

    console.log('PDF Player Config Created:', {
      channel,
      sid,
      uid,
      did,
      artifactUrl: metadata.artifactUrl,
      identifier: metadata.identifier,
    });

    return finalConfig;
  }

  /**
   * Create PDF player element with configuration
   */
  createElement(config: PdfPlayerConfig): HTMLElement {
    const element = document.createElement('sunbird-pdf-player');
    const configString = JSON.stringify(config);
    
    console.log('Creating PDF player element');
    console.log('Config summary:', {
      identifier: config.metadata.identifier,
      name: config.metadata.name,
      artifactUrl: config.metadata.artifactUrl,
      streamingUrl: config.metadata.streamingUrl,
      channel: config.context.channel,
      mode: config.context.mode,
      sid: config.context.sid,
      uid: config.context.uid,
      did: config.context.did,
    });
    console.log('Full config object:', config);
    
    element.setAttribute('player-config', configString);
    element.setAttribute('data-player-id', config.metadata.identifier);
    
    return element;
  }

  /**
   * Attach event listeners to the player element
   */
  attachEventListeners(
    element: HTMLElement,
    onPlayerEvent?: (event: PdfPlayerEvent) => void,
    onTelemetryEvent?: (event: any) => void
  ): void {
    // Remove any existing handler first to prevent memory leaks
    this.removeEventListeners(element);

    const playerHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (onPlayerEvent) {
        const pdfEvent: PdfPlayerEvent = {
          type: customEvent.detail?.eid || 'unknown',
          data: customEvent.detail,
          playerId: element.getAttribute('data-player-id') || 'pdf-player',
          timestamp: Date.now(),
        };
        onPlayerEvent(pdfEvent);
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
