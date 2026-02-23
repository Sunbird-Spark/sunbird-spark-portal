import { PdfPlayerConfig, PdfPlayerEvent, PdfPlayerContextProps, PdfPlayerMetadata } from './types';
import userAuthInfoService from '../../userAuthInfoService/userAuthInfoService';
import appCoreService from '../../AppCoreService';
import { OrganizationService } from '../../OrganizationService';

/**
 * Service for initializing and managing the PDF Player.
 * Handles player creation, configuration, and event management.
 * 
 * Style Loading Strategy:
 * - PDF player styles are fetched once and cached in memory
 * - Styles are injected using CSS @scope to scope them to the player wrapper
 * - This prevents CSS bleed into the rest of the page while keeping styles
 *   functional for the player's children
 */
export class PdfPlayerService {
  private eventHandlers = new WeakMap<HTMLElement, { player: (event: Event) => void; telemetry: (event: Event) => void }>();
  private orgService = new OrganizationService();
  private static cachedCss: string | null = null;
  private static cssLoading?: Promise<string>;
  private static scriptLoaded = false;
  private static scriptLoading?: Promise<void>;

  private loadScript(): Promise<void> {
    if (PdfPlayerService.scriptLoaded || customElements.get('sunbird-pdf-player')) {
      PdfPlayerService.scriptLoaded = true;
      return Promise.resolve();
    }
    if (PdfPlayerService.scriptLoading) {
      return PdfPlayerService.scriptLoading;
    }
    PdfPlayerService.scriptLoading = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/assets/pdf-player/sunbird-pdf-player.js';
      script.setAttribute('data-pdf-player-script', 'true');
      script.onload = () => { PdfPlayerService.scriptLoaded = true; PdfPlayerService.scriptLoading = undefined; resolve(); };
      script.onerror = () => { PdfPlayerService.scriptLoading = undefined; reject(new Error('Failed to load sunbird-pdf-player script')); };
      document.body.appendChild(script);
    });
    return PdfPlayerService.scriptLoading;
  }

  /**
   * Create PDF player configuration with context props and metadata
   * @param metadata - Content metadata from backend
   * @param contextProps - Optional context properties (mode, cdata, contextRollup, objectRollup)
   */
  async createConfig(
    metadata: PdfPlayerMetadata,
    contextProps?: PdfPlayerContextProps
  ): Promise<PdfPlayerConfig> {
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
   * Fetch and cache the PDF player CSS content.
   * The CSS is fetched once and reused across all player instances.
   */
  private async fetchStyles(): Promise<string> {
    if (PdfPlayerService.cachedCss !== null) {
      return PdfPlayerService.cachedCss;
    }
    if (PdfPlayerService.cssLoading) {
      return PdfPlayerService.cssLoading;
    }
    PdfPlayerService.cssLoading = fetch('/assets/pdf-player/styles.css')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch pdf player styles: ${response.status}`);
        }
        return response.text();
      })
      .then(css => {
        PdfPlayerService.cachedCss = css;
        PdfPlayerService.cssLoading = undefined;
        return css;
      })
      .catch(error => {
        PdfPlayerService.cssLoading = undefined;
        console.error('Failed to load pdf player styles:', error);
        return '';
      });
    return PdfPlayerService.cssLoading;
  }

  /**
   * Rewrite CSS selectors so they work inside @scope.
   * - :root → :scope (CSS variables get applied to the wrapper)
   * - html / body → :scope (base styles target the wrapper instead)
   * - Compound selectors like html[dir=rtl] → :scope[dir=rtl]
   */
  private rewriteCssForScope(css: string): string {
    // Replace :root with :scope so variable definitions apply to the scoping element
    let rewritten = css.replace(/:root/g, ':scope');

    // Replace standalone html/body selectors and compound html[...]/body[...] selectors
    // with :scope, so base typography, colors, bg etc. apply to the wrapper.
    // Uses negative lookbehind/lookahead to avoid replacing inside words/URLs.
    rewritten = rewritten.replace(/(?<![a-zA-Z-])html(?=\s*[{,[:]|$)/g, ':scope');
    rewritten = rewritten.replace(/(?<![a-zA-Z-])body(?=\s*[{,[:]|$)/g, ':scope');

    return rewritten;
  }

  /**
   * No-op: styles are scoped via CSS @scope inside the wrapper element
   * and cleaned up automatically when the wrapper is removed from the DOM.
   */
  static unloadStyles(): void {
    // Styles are scoped inside the wrapper and removed automatically
  }

  /**
   * Create PDF player element with styles scoped via CSS @scope.
   * Fetches the CSS content, rewrites html/body selectors for scoping,
   * wraps it in @scope to prevent global bleed, and injects as a <style> tag.
   */
  async createElement(config: PdfPlayerConfig): Promise<HTMLElement> {
    // Fetch CSS content (cached after first fetch)
    const cssContent = await this.fetchStyles();

    // Wrapper scopes the styles and keeps them alongside the player
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-pdf-player-wrapper', 'true');
    wrapper.setAttribute('data-player-id', config.metadata.identifier);
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';

    // Inject scoped styles — rewrite global selectors and wrap in @scope
    if (cssContent) {
      const scopedCss = this.rewriteCssForScope(cssContent);
      const styleEl = document.createElement('style');
      styleEl.setAttribute('data-pdf-player-styles', 'true');
      styleEl.textContent = `@scope ([data-pdf-player-wrapper]) {\n${scopedCss}\n}`;
      wrapper.appendChild(styleEl);
    }

    const element = document.createElement('sunbird-pdf-player');
    const configString = JSON.stringify(config);

    console.log('Creating PDF player element');

    element.setAttribute('player-config', configString);
    element.setAttribute('data-player-id', config.metadata.identifier);
    wrapper.appendChild(element);

    return wrapper;
  }

  /**
   * Get the actual sunbird-pdf-player element from a wrapper.
   */
  private getPlayerElement(element: HTMLElement): HTMLElement {
    return (element.querySelector('sunbird-pdf-player') as HTMLElement) || element;
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

    const playerEl = this.getPlayerElement(element);

    const playerHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (onPlayerEvent) {
        const pdfEvent: PdfPlayerEvent = {
          type: customEvent.detail?.eid || 'unknown',
          data: customEvent.detail,
          playerId: playerEl.getAttribute('data-player-id') || 'pdf-player',
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

    playerEl.addEventListener('playerEvent', playerHandler);
    playerEl.addEventListener('telemetryEvent', telemetryHandler);

    // Store handlers for cleanup
    this.eventHandlers.set(element, { player: playerHandler, telemetry: telemetryHandler });
  }

  /**
   * Remove event listeners from the player element
   */
  removeEventListeners(element: HTMLElement): void {
    const handlers = this.eventHandlers.get(element);
    if (handlers) {
      const playerEl = this.getPlayerElement(element);
      playerEl.removeEventListener('playerEvent', handlers.player);
      playerEl.removeEventListener('telemetryEvent', handlers.telemetry);
      this.eventHandlers.delete(element);
    }
  }

}
