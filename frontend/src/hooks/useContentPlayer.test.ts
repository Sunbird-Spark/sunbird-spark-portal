import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useContentPlayer, PlayerEvent, TelemetryEvent } from './useContentPlayer';

describe('useContentPlayer', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handlePlayerEvent', () => {
    it('logs the event when enableLogging is true (default)', () => {
      const { result } = renderHook(() => useContentPlayer());
      const event: PlayerEvent = { type: 'PLAY', data: { id: '1' } };

      result.current.handlePlayerEvent(event);

      expect(console.log).toHaveBeenCalledWith('Player Event:', event);
    });

    it('does not log when enableLogging is false', () => {
      const { result } = renderHook(() => useContentPlayer({ enableLogging: false }));
      const event: PlayerEvent = { type: 'PAUSE' };

      result.current.handlePlayerEvent(event);

      expect(console.log).not.toHaveBeenCalled();
    });

    it('calls onPlayerEvent callback when provided', () => {
      const onPlayerEvent = vi.fn();
      const { result } = renderHook(() => useContentPlayer({ onPlayerEvent }));
      const event: PlayerEvent = { type: 'END', timestamp: 123 };

      result.current.handlePlayerEvent(event);

      expect(onPlayerEvent).toHaveBeenCalledWith(event);
    });

    it('does not throw when onPlayerEvent is not provided', () => {
      const { result } = renderHook(() => useContentPlayer());
      expect(() => result.current.handlePlayerEvent({ type: 'PLAY' })).not.toThrow();
    });
  });

  describe('handleTelemetryEvent', () => {
    it('logs the event when enableLogging is true (default)', () => {
      const { result } = renderHook(() => useContentPlayer());
      const event: TelemetryEvent = { type: 'IMPRESSION', eid: 'IMPRESSION' };

      result.current.handleTelemetryEvent(event);

      expect(console.log).toHaveBeenCalledWith('Telemetry Event:', event);
    });

    it('does not log when enableLogging is false', () => {
      const { result } = renderHook(() => useContentPlayer({ enableLogging: false }));
      const event: TelemetryEvent = { type: 'INTERACT', eid: 'INTERACT' };

      result.current.handleTelemetryEvent(event);

      expect(console.log).not.toHaveBeenCalled();
    });

    it('calls onTelemetryEvent callback when provided', () => {
      const onTelemetryEvent = vi.fn();
      const { result } = renderHook(() => useContentPlayer({ onTelemetryEvent }));
      const event: TelemetryEvent = { type: 'END', edata: { pageid: 'home' } };

      result.current.handleTelemetryEvent(event);

      expect(onTelemetryEvent).toHaveBeenCalledWith(event);
    });

    it('does not throw when onTelemetryEvent is not provided', () => {
      const { result } = renderHook(() => useContentPlayer());
      expect(() => result.current.handleTelemetryEvent({ type: 'LOG' })).not.toThrow();
    });
  });

  describe('callback stability', () => {
    it('returns stable callback references between renders', () => {
      const { result, rerender } = renderHook(() => useContentPlayer({ enableLogging: false }));
      const firstHandlePlayer = result.current.handlePlayerEvent;
      const firstHandleTelemetry = result.current.handleTelemetryEvent;

      rerender();

      expect(result.current.handlePlayerEvent).toBe(firstHandlePlayer);
      expect(result.current.handleTelemetryEvent).toBe(firstHandleTelemetry);
    });
  });
});
