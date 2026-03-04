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

export class TelemetryService {
  private _isInitialized = false;

  public initialize(config: TelemetryConfig): void {
    $t.initialize(config);
    this._isInitialized = true;
  }

  public interact(eventInput: TelemetryEventInput): void {
    if (this._isInitialized) {
      $t.interact(eventInput.edata, eventInput.options);
    }
  }

  public impression(eventInput: TelemetryEventInput): void {
    if (!this._isInitialized) return;

    const pageId = eventInput.edata?.pageid;
    // Debounce to prevent spam from duplicate/refresh events
    // Only debounce if the current pageId is EXACTLY the same as the immediately preceding pageId within the time window
    if (pageId) {
      const lastPageIdKey = 'telemetry_last_pageid';
      const lastTimeKey = 'telemetry_last_impression_time';

      const lastPageId = sessionStorage.getItem(lastPageIdKey);
      const lastTime = sessionStorage.getItem(lastTimeKey);

      if (lastPageId === pageId && lastTime) {
        const timeDiff = Date.now() - parseInt(lastTime, 10);
        if (timeDiff < 5000) {
          // Drop event
          return;
        }
      }

      sessionStorage.setItem(lastPageIdKey, pageId);
      sessionStorage.setItem(lastTimeKey, Date.now().toString());
    }

    $t.impression(eventInput.edata, eventInput.options);
  }

  public start(config: any, contentId: string, contentVer: string, data: any, options?: any): void {
     if (this._isInitialized) {
       $t.start(config, contentId, contentVer, data, options);
     }
  }

  public end(eventInput: TelemetryEventInput): void {
    if (this._isInitialized) {
      $t.end(eventInput.edata, eventInput.options);
    }
  }

  public error(eventInput: TelemetryEventInput): void {
    if (this._isInitialized) {
      $t.error(eventInput.edata, eventInput.options);
    }
  }

  public audit(eventInput: TelemetryEventInput): void {
    if (this._isInitialized) {
      $t.audit(eventInput.edata, eventInput.options);
    }
  }

  public share(eventInput: TelemetryEventInput): void {
    if (this._isInitialized) {
      $t.share(eventInput.edata, eventInput.options);
    }
  }

  public log(eventInput: TelemetryEventInput): void {
    if (this._isInitialized) {
      $t.log(eventInput.edata, eventInput.options);
    }
  }

  public exData(eventInput: TelemetryEventInput): void {
    if (this._isInitialized) {
      $t.exdata(eventInput.edata, eventInput.options);
    }
  }

  public feedback(eventInput: TelemetryEventInput): void {
    if (this._isInitialized) {
      $t.feedback(eventInput.edata, eventInput.options);
    }
  }

  public get isInitialized(): boolean {
    return this._isInitialized;
  }
}

export const telemetryService = new TelemetryService();
