import { EpubPlayerConfig, EpubPlayerEvent, EpubPlayerContextProps, EpubPlayerMetadata } from './types';
import { buildTelemetryContext } from '../telemetryContextBuilder';

/**
 * Service for initializing and managing the EPUB Player.
 * Handles player creation, configuration, and event management.
 * 
 * Style Loading Strategy:
 * - EPUB player styles are fetched once and cached in memory
 * - Styles are injected using CSS @scope to scope them to the player wrapper
 * - This prevents CSS bleed into the rest of the page while keeping styles
 *   functional for the player's children
 */
export class EpubPlayerService {
  private eventHandlers = new WeakMap<HTMLElement, { player: (event: Event) => void; telemetry: (event: Event) => void }>();

  private static scriptLoaded = false;
  private static scriptLoading?: Promise<void>;
  private static cachedCss: string | null = null;
  private static cssLoading?: Promise<string>;

  private loadScript(): Promise<void> {
    if (EpubPlayerService.scriptLoaded || customElements.get('sunbird-epub-player')) {
      EpubPlayerService.scriptLoaded = true;
      return Promise.resolve();
    }
    /* c8 ignore next 12 */
    if (EpubPlayerService.scriptLoading) {
      return EpubPlayerService.scriptLoading;
    }
    EpubPlayerService.scriptLoading = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/assets/epub-player/sunbird-epub-player.js';
      script.setAttribute('data-epub-player-script', 'true');
      script.onload = () => { EpubPlayerService.scriptLoaded = true; EpubPlayerService.scriptLoading = undefined; resolve(); };
      script.onerror = () => { EpubPlayerService.scriptLoading = undefined; reject(new Error('Failed to load sunbird-epub-player script')); };
      document.body.appendChild(script);
    });
    return EpubPlayerService.scriptLoading;
  }

  /**
   * Create EPUB player configuration with context props and metadata
   * @param metadata - Content metadata from backend
   * @param contextProps - Optional context properties (mode, cdata, contextRollup, objectRollup)
   */
  async createConfig(
    metadata: EpubPlayerMetadata,
    contextProps?: EpubPlayerContextProps
  ): Promise<EpubPlayerConfig> {
    await this.loadScript();
    const context = await buildTelemetryContext(contextProps, { contentId: metadata.identifier });

    return {
      context,
      config: {},
      metadata,
    };
  }

  /**
   * Fetch and cache the EPUB player CSS content.
   * The CSS is fetched once and reused across all player instances.
   */
  private async fetchStyles(): Promise<string> {
    if (EpubPlayerService.cachedCss !== null) {
      return EpubPlayerService.cachedCss;
    }
    if (EpubPlayerService.cssLoading) {
      return EpubPlayerService.cssLoading;
    }
    EpubPlayerService.cssLoading = fetch('/assets/epub-player/styles.css')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch epub player styles: ${response.status}`);
        }
        return response.text();
      })
      .then(css => {
        EpubPlayerService.cachedCss = css;
        EpubPlayerService.cssLoading = undefined;
        return css;
      })
      .catch(error => {
        EpubPlayerService.cachedCss = '';
        EpubPlayerService.cssLoading = undefined;
        console.error('Failed to load epub player styles:', error);
        return '';
      });
    return EpubPlayerService.cssLoading;
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
    // when the wrapper element is removed from the DOM.
  }

  /**
   * Create EPUB player element with styles scoped via CSS @scope.
   * Fetches the CSS content, rewrites :root/html/body selectors for scoping,
   * wraps it in @scope to prevent global bleed, and injects as a <style> tag.
   */
  async createElement(config: EpubPlayerConfig): Promise<HTMLElement> {
    // Fetch CSS content (cached after first fetch)
    const cssContent = await this.fetchStyles();

    // Wrapper scopes the styles and keeps them alongside the player
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-epub-player-wrapper', 'true');
    wrapper.setAttribute('data-player-id', config.metadata.identifier);
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';

    // Inject scoped styles — rewrite global selectors and wrap in @scope
    if (cssContent) {
      const scopedCss = this.rewriteCssForScope(cssContent);
      const styleEl = document.createElement('style');
      styleEl.setAttribute('data-epub-player-styles', 'true');
      styleEl.textContent = `@scope ([data-epub-player-wrapper]) {\n${scopedCss}\n}`;
      wrapper.appendChild(styleEl);
    }

    // Player element
    const element = document.createElement('sunbird-epub-player');
    const configString = JSON.stringify(config);
    element.setAttribute('player-config', configString);
    element.setAttribute('data-player-id', config.metadata.identifier);
    wrapper.appendChild(element);

    return wrapper;
  }

  /**
   * Get the actual sunbird-epub-player element from a wrapper.
   */
  private getPlayerElement(element: HTMLElement): HTMLElement {
    return (element.querySelector('sunbird-epub-player') as HTMLElement) || element;
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

    const playerEl = this.getPlayerElement(element);

    const playerHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (onPlayerEvent) {
        const epubEvent: EpubPlayerEvent = {
          type: customEvent.detail?.eid || 'unknown',
          data: customEvent.detail,
          playerId: playerEl.getAttribute('data-player-id') || 'epub-player',
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

    playerEl.addEventListener('playerEvent', playerHandler);
    playerEl.addEventListener('telemetryEvent', telemetryHandler);

    // Store handlers keyed by wrapper for cleanup
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
