/**
 * NavigationHelperService
 *
 * Tracks page navigation timing and guards against duplicate navigation events.
 *
 *  - pageStartTime is set at module load and reset after each impression fires.
 *  - getPageLoadTime() returns elapsed seconds since the last pageStartTime.
 *  - storeUrlHistory() deduplicates same-URL navigations (handles refresh / same-page links)
 *    by popping the last entry, comparing, and only pushing both back when URLs differ.
 *  - shouldProcessNavigationClick() throttles rapid duplicate clicks on back/close buttons
 *    to 250ms, mirroring throttleTime(250) on navigateToPreviousUrl$ in the reference.
 */
export class NavigationHelperService {
  /** Timestamp (ms) of the last navigation start. Updated after each impression. */
  private _pageStartTime: number = Date.now();

  public get pageStartTime(): number {
    return this._pageStartTime;
  }

  public resetPageStartTime(): void {
    this._pageStartTime = Date.now();
  }

  private _history: string[] = [];

  /**
   * Timestamp of the last navigation button click.
   * Used by shouldProcessNavigationClick() to enforce 250ms throttle.
   */
  private _lastNavigationClickTime: number = 0;
  private readonly NAVIGATION_THROTTLE_MS = 250;

  /**
   * Returns time in seconds since pageStartTime was last set.
   */
  public getPageLoadTime(): number {
    const pageEndTime = Date.now();
    return (pageEndTime - this.pageStartTime) / 1000;
  }

  /**
   * Deduplicates same-URL navigations (refresh / clicking a link to the current page).
   *   - Pops the last URL from history.
   *   - If same as incoming URL, pushes only the new URL (no growth).
   *   - If different, pushes both old and new URLs.
   */
  public storeUrlHistory(url: string): void {
    const previousUrl = this._history.pop();
    if (previousUrl === undefined || previousUrl === url) {
      this._history.push(url);
    } else {
      this._history.push(previousUrl, url);
    }
  }

  public getPreviousUrl(): string | undefined {
    return this._history[this._history.length - 2];
  }

  /**
   * Throttle guard for back/close navigation buttons.
   * Returns true if the click should be processed (leading edge only).
   * Returns false if a click already fired within the last 250ms.
   *
   * applied to navigateToPreviousUrl$ in the reference service.
   *
   * Usage:
   *   onClick={() => { if (navigationHelperService.shouldProcessNavigationClick()) navigate(-1); }}
   */
  public shouldProcessNavigationClick(): boolean {
    const now = Date.now();
    if (now - this._lastNavigationClickTime < this.NAVIGATION_THROTTLE_MS) {
      return false; // throttled — discard
    }
    this._lastNavigationClickTime = now;
    return true;
  }
}

export const navigationHelperService = new NavigationHelperService();
