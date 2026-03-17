import { $t } from '@project-sunbird/telemetry-sdk';

export interface TelemetryEventInput {
  edata: any;
  context?: any;
  object?: any;
  options?: any;
}

export interface TelemetryConfig {
  host?: string;
  endpoint?: string;
  // Add other valid config options from TelemetryConfig as required
  [key: string]: any;
}

export interface ITelemetryService {
  interact(eventInput: TelemetryEventInput): void;
  impression(eventInput: TelemetryEventInput): void;
  start(config: Record<string, unknown> | any, contentId: string, contentVer: string, data: Record<string, unknown> | any, options?: Omit<TelemetryEventInput, 'edata'>): void;
  end(eventInput: TelemetryEventInput): void;
  error(eventInput: TelemetryEventInput): void;
  audit(eventInput: TelemetryEventInput): void;
  share(eventInput: TelemetryEventInput): void;
  log(eventInput: TelemetryEventInput): void;
  exData(eventInput: TelemetryEventInput): void;
  feedback(eventInput: TelemetryEventInput): void;
  get isInitialized(): boolean;
}

export class TelemetryService implements ITelemetryService {
  private _isInitialized = false;
  private _lastImpressionPageId: string | null = null;
  private _lastImpressionTime: number = 0;

  private getOptions(eventInput: TelemetryEventInput): any {
    const options = { ...eventInput.options };
    if (eventInput.context) {
      options.context = { ...(options.context || {}), ...eventInput.context };
    }
    if (eventInput.object) {
      options.object = { ...(options.object || {}), ...eventInput.object };
    }
    return Object.keys(options).length > 0 ? options : undefined;
  }

  public initialize(config: TelemetryConfig): void {
    $t.initialize(config);
    this._isInitialized = true;
  }

  public interact(eventInput: TelemetryEventInput): void {
    if (this._isInitialized) {
      $t.interact(eventInput.edata, this.getOptions(eventInput));
    }
  }

  public impression(eventInput: TelemetryEventInput): void {
    if (!this._isInitialized) return;

    const pageId = eventInput.edata?.pageid;
    // Debounce to prevent spam from duplicate/refresh events
    // Only debounce if the current pageId is EXACTLY the same as the immediately preceding pageId within the time window
    if (pageId) {
      if (this._lastImpressionPageId === pageId && this._lastImpressionTime) {
        const timeDiff = Date.now() - this._lastImpressionTime;
        if (timeDiff < 5000) {
          // Drop event
          return;
        }
      }

      this._lastImpressionPageId = pageId;
      this._lastImpressionTime = Date.now();
    }

    $t.impression(eventInput.edata, this.getOptions(eventInput));
  }

  public start(config: Record<string, unknown> | any, contentId: string, contentVer: string, data: Record<string, unknown> | any, options?: Omit<TelemetryEventInput, 'edata'>): void {
     if (this._isInitialized) {
       const mergedOptions = options ? this.getOptions({ edata: data, ...options } as TelemetryEventInput) : undefined;
       $t.start(config, contentId, contentVer, data, mergedOptions);
     }
  }

  public end(eventInput: TelemetryEventInput): void {
    if (this._isInitialized) {
      $t.end(eventInput.edata, this.getOptions(eventInput));
    }
  }

  public error(eventInput: TelemetryEventInput): void {
    if (this._isInitialized) {
      $t.error(eventInput.edata, this.getOptions(eventInput));
    }
  }

  public audit(eventInput: TelemetryEventInput): void {
    if (this._isInitialized) {
      $t.audit(eventInput.edata, this.getOptions(eventInput));
    }
  }

  public share(eventInput: TelemetryEventInput): void {
    if (this._isInitialized) {
      $t.share(eventInput.edata, this.getOptions(eventInput));
    }
  }

  public log(eventInput: TelemetryEventInput): void {
    if (this._isInitialized) {
      $t.log(eventInput.edata, this.getOptions(eventInput));
    }
  }

  public exData(eventInput: TelemetryEventInput): void {
    if (this._isInitialized) {
      $t.exdata(eventInput.edata, this.getOptions(eventInput));
    }
  }

  public feedback(eventInput: TelemetryEventInput): void {
    if (this._isInitialized) {
      $t.feedback(eventInput.edata, this.getOptions(eventInput));
    }
  }

  public get isInitialized(): boolean {
    return this._isInitialized;
  }
}

export const telemetryService = new TelemetryService();
