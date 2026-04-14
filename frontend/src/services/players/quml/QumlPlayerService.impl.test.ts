import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QumlPlayerService } from './QumlPlayerService';
import type { QumlPlayerMetadata, QumlPlayerEvent } from './types';

describe('QumlPlayerService - Implementation Details', () => {
  let service: QumlPlayerService;

  const mockMetadata: QumlPlayerMetadata = {
    identifier: 'do_123',
    name: 'Test Question Set',
    mimeType: 'application/vnd.sunbird.questionset',
    channel: 'test-channel',
  };

  beforeEach(() => {
    service = new QumlPlayerService();
  });

  describe('createElement - detailed tests', () => {
    it('should set player-config attribute', () => {
      const config = {
        context: { sid: 'test' } as any,
        config: {},
        metadata: mockMetadata,
        data: {},
      };

      const element = service.createElement(config);
      const configAttr = element.getAttribute('player-config');

      expect(configAttr).toBeTruthy();
      expect(JSON.parse(configAttr!)).toEqual(config);
    });

    it('should set data-player-id attribute', () => {
      const config = {
        context: { sid: 'test' } as any,
        config: {},
        metadata: mockMetadata,
        data: {},
      };

      const element = service.createElement(config);

      expect(element.getAttribute('data-player-id')).toBe('do_123');
    });

    it('should load styles on first createElement call', () => {
      const config = {
        context: { sid: 'test' } as any,
        config: {},
        metadata: mockMetadata,
        data: {},
      };

      // Clear any existing styles
      document.querySelectorAll('[data-quml-player-styles]').forEach(el => el.remove());
      (QumlPlayerService as any).stylesLoaded = false;

      service.createElement(config);

      const styleLink = document.querySelector('[data-quml-player-styles="true"]');
      expect(styleLink).toBeTruthy();
      expect(styleLink?.getAttribute('href')).toBe('/assets/quml-player/styles.css');
    });
  });

  describe('attachEventListeners', () => {
    let element: HTMLElement;
    let onPlayerEvent: (event: QumlPlayerEvent) => void;
    let onTelemetryEvent: (event: any) => void;

    beforeEach(() => {
      element = document.createElement('div');
      element.setAttribute('data-player-id', 'test-player');
      onPlayerEvent = vi.fn();
      onTelemetryEvent = vi.fn();
    });

    it('should attach playerEvent listener', () => {
      service.attachEventListeners(element, onPlayerEvent);

      const event = new CustomEvent('playerEvent', {
        detail: { eid: 'START', data: { score: 10 } },
      });
      element.dispatchEvent(event);

      expect(onPlayerEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'START',
          playerId: 'test-player',
        })
      );
    });

    it('should attach telemetryEvent listener', () => {
      service.attachEventListeners(element, undefined, onTelemetryEvent);

      const event = new CustomEvent('telemetryEvent', {
        detail: { eid: 'INTERACT', data: {} },
      });
      element.dispatchEvent(event);

      expect(onTelemetryEvent).toHaveBeenCalledWith({ eid: 'INTERACT', data: {} });
    });

    it('should include timestamp in player event', () => {
      const before = Date.now();
      service.attachEventListeners(element, onPlayerEvent);

      const event = new CustomEvent('playerEvent', {
        detail: { eid: 'END' },
      });
      element.dispatchEvent(event);
      const after = Date.now();

      const mockFn = onPlayerEvent as any;
      const call = mockFn.mock.calls[0]?.[0] as QumlPlayerEvent;
      expect(call.timestamp).toBeGreaterThanOrEqual(before);
      expect(call.timestamp).toBeLessThanOrEqual(after);
    });

    it('should remove existing listeners before attaching new ones', () => {
      service.attachEventListeners(element, onPlayerEvent);
      service.attachEventListeners(element, onPlayerEvent);

      const event = new CustomEvent('playerEvent', {
        detail: { eid: 'START' },
      });
      element.dispatchEvent(event);

      // Should only be called once (old handler removed)
      expect(onPlayerEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeEventListeners', () => {
    let element: HTMLElement;
    let onPlayerEvent: (event: QumlPlayerEvent) => void;

    beforeEach(() => {
      element = document.createElement('div');
      onPlayerEvent = vi.fn();
    });

    it('should remove event listeners', () => {
      service.attachEventListeners(element, onPlayerEvent);
      service.removeEventListeners(element);

      const event = new CustomEvent('playerEvent', {
        detail: { eid: 'START' },
      });
      element.dispatchEvent(event);

      expect(onPlayerEvent).not.toHaveBeenCalled();
    });

    it('should handle removing listeners from element without handlers', () => {
      expect(() => service.removeEventListeners(element)).not.toThrow();
    });
  });
});
