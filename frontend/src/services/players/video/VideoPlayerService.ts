import { VideoPlayerConfig, VideoPlayerEvent, VideoPlayerContextProps, VideoPlayerMetadata } from './types';
import { buildTelemetryContext } from '../telemetryContextBuilder';

/**
 * Service for initializing and managing the Video Player.
 * Handles player creation, configuration, and event management.
 * 
 * Style Loading Strategy:
 * - Video player styles are fetched once and cached in memory
 * - Styles are injected using CSS @scope to scope them to the player wrapper
 * - This prevents CSS bleed into the rest of the page while keeping styles
 *   functional for the player's children
 */
export class VideoPlayerService {
  private eventHandlers = new WeakMap<
    HTMLElement,
    { player: (event: Event) => void; telemetry: (event: Event) => void }
  >();
  private static cachedCss: string | null = null;
  private static cssLoading?: Promise<string>;
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
    // Styles are scoped inside the wrapper and removed automatically
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
    const context = await buildTelemetryContext(contextProps, { contentId: metadata.identifier });

    return {
      context,
      config: {},
      metadata,
    };
  }

  /**
   * Fetch and cache the Video player CSS content.
   * The CSS is fetched once and reused across all player instances.
   */
  private async fetchStyles(): Promise<string> {
    if (VideoPlayerService.cachedCss !== null) {
      return VideoPlayerService.cachedCss;
    }
    if (VideoPlayerService.cssLoading) {
      return VideoPlayerService.cssLoading;
    }
    VideoPlayerService.cssLoading = fetch('/assets/video-player/styles.css')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch video player styles: ${response.status}`);
        }
        return response.text();
      })
      .then(css => {
        VideoPlayerService.cachedCss = css;
        VideoPlayerService.cssLoading = undefined;
        return css;
      })
      .catch(error => {
        VideoPlayerService.cachedCss = '';
        VideoPlayerService.cssLoading = undefined;
        console.error('Failed to load video player styles:', error);
        VideoPlayerService.cachedCss = '';
        return '';
      });
    return VideoPlayerService.cssLoading;
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
   * Create video player element with styles scoped via CSS @scope.
   * Fetches the CSS content, rewrites html/body selectors for scoping,
   * wraps it in @scope to prevent global bleed, and injects as a <style> tag.
   */
  async createElement(config: VideoPlayerConfig): Promise<HTMLElement> {
    // Fetch CSS content (cached after first fetch)
    const cssContent = await this.fetchStyles();

    // Wrapper scopes the styles and keeps them alongside the player
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-video-player-wrapper', 'true');
    wrapper.setAttribute('data-player-id', config.metadata.identifier);
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';

    // Inject scoped styles — rewrite global selectors and wrap in @scope
    if (cssContent) {
      const scopedCss = this.rewriteCssForScope(cssContent);
      const styleEl = document.createElement('style');
      styleEl.setAttribute('data-video-player-styles', 'true');
      styleEl.textContent = `@scope ([data-video-player-wrapper]) {\n${scopedCss}\n}`;
      wrapper.appendChild(styleEl);
    }

    const element = document.createElement('sunbird-video-player');
    const configString = JSON.stringify(config);

    element.setAttribute('player-config', configString);
    element.setAttribute('data-player-id', config.metadata.identifier);
    wrapper.appendChild(element);

    return wrapper;
  }

  /**
   * Get the actual sunbird-video-player element from a wrapper.
   */
  private getPlayerElement(element: HTMLElement): HTMLElement {
    return (element.querySelector('sunbird-video-player') as HTMLElement) || element;
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

    const playerEl = this.getPlayerElement(element);

    const playerHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (onPlayerEvent) {
        const videoEvent: VideoPlayerEvent = {
          type: customEvent.detail?.eid || 'unknown',
          data: customEvent.detail,
          playerId: playerEl.getAttribute('data-player-id') || 'video-player',
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
