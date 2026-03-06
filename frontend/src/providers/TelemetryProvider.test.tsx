import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TelemetryProvider, TelemetryContext } from './TelemetryProvider';
import { telemetryService } from '../services/TelemetryService';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';

vi.mock('../services/TelemetryService', () => ({
  telemetryService: {
    isInitialized: false,
    initialize: vi.fn(),
    start: vi.fn(),
    interact: vi.fn(),
  },
}));

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getUserId: vi.fn(() => 'test-user-id'),
  },
}));

const TestChild = () => {
  const telemetry = React.useContext(TelemetryContext);
  return (
    <div>
      <span data-testid="telemetry-status">
        {telemetry ? 'Available' : 'Not Available'}
      </span>
      <button 
        data-testid="interactive-btn"
        data-edataid="test-button"
        data-edatatype="CLICK"
        data-pageid="test-page"
        data-cdata={JSON.stringify([{ id: 'c1', type: 'context' }])}
      >
        Click Me (with cdata)
      </button>
      <button 
        data-testid="interactive-btn-object"
        data-edataid="test-button-2"
        data-objectid="obj1"
        data-objecttype="content"
      >
        Click Me (with objectid)
      </button>
      <button 
        data-testid="interactive-btn-invalid-cdata"
        data-edataid="test-button-3"
        data-cdata="invalid-json"
      >
        Click Me (invalid cdata)
      </button>
      <button data-testid="non-interactive-btn">
        Normal Button
      </button>
    </div>
  );
};

describe('TelemetryProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    // Reset telemetryService mock state
    Object.defineProperty(telemetryService, 'isInitialized', { value: false, writable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('provides telemetry service to children', () => {
    render(
      <TelemetryProvider>
        <TestChild />
      </TelemetryProvider>
    );
    expect(screen.getByTestId('telemetry-status')).toHaveTextContent('Available');
  });

  it('initializes telemetryService when mounted if not already initialized', () => {
    render(
      <TelemetryProvider>
        <TestChild />
      </TelemetryProvider>
    );

    expect(telemetryService.initialize).toHaveBeenCalled();
    expect(telemetryService.start).toHaveBeenCalledWith(
      expect.any(Object),
      'app',
      '1.0',
      { type: 'app', mode: 'play', pageid: 'home' }
    );
  });

  it('does not re-initialize telemetryService if already initialized', () => {
    // Set up mock to act as if already initialized
    Object.defineProperty(telemetryService, 'isInitialized', { value: true, writable: true });

    render(
      <TelemetryProvider>
        <TestChild />
      </TelemetryProvider>
    );

    expect(telemetryService.initialize).not.toHaveBeenCalled();
    expect(telemetryService.start).not.toHaveBeenCalled();
  });

  it('computes telemetryConfig correctly with fallbacks', () => {
    localStorage.setItem('deviceId', 'test-device');
    sessionStorage.setItem('sid', 'test-session');
    
    render(
      <TelemetryProvider>
        <TestChild />
      </TelemetryProvider>
    );

    expect(telemetryService.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        did: 'test-device',
        uid: 'test-user-id',
        sid: 'test-session',
      })
    );
  });

  it('computes telemetryConfig correctly when local storage is empty', () => {
    (userAuthInfoService.getUserId as any).mockReturnValueOnce(null);
    
    render(
      <TelemetryProvider>
        <TestChild />
      </TelemetryProvider>
    );

    expect(telemetryService.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        did: 'anonymous-device',
        uid: 'anonymous',
        sid: expect.stringMatching(/^session-\d+$/),
      })
    );
  });

  describe('Global Click Listener', () => {
    it('captures click events on elements with data-edataid and cdata', () => {
      render(
        <TelemetryProvider>
          <TestChild />
        </TelemetryProvider>
      );

      fireEvent.click(screen.getByTestId('interactive-btn'));

      expect(telemetryService.interact).toHaveBeenCalledTimes(1);
      expect(telemetryService.interact).toHaveBeenCalledWith({
        edata: {
          id: 'test-button',
          type: 'CLICK',
          pageid: 'test-page'
        },
        options: {
          context: {
            cdata: [{ id: 'c1', type: 'context' }]
          }
        }
      });
    });

    it('captures click events on elements with data-edataid, objectid, and objecttype', () => {
      render(
        <TelemetryProvider>
          <TestChild />
        </TelemetryProvider>
      );

      fireEvent.click(screen.getByTestId('interactive-btn-object'));

      expect(telemetryService.interact).toHaveBeenCalledTimes(1);
      expect(telemetryService.interact).toHaveBeenCalledWith({
        edata: {
          id: 'test-button-2',
          type: 'CLICK'
        },
        options: {
          context: {
            cdata: [{ id: 'obj1', type: 'content' }]
          }
        }
      });
    });

    it('handles invalid JSON in data-cdata gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <TelemetryProvider>
          <TestChild />
        </TelemetryProvider>
      );

      fireEvent.click(screen.getByTestId('interactive-btn-invalid-cdata'));

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(telemetryService.interact).toHaveBeenCalledTimes(1);
      expect(telemetryService.interact).toHaveBeenCalledWith({
        edata: {
          id: 'test-button-3',
          type: 'CLICK'
        }
        // context is missing because JSON parsing failed
      });

      consoleErrorSpy.mockRestore();
    });

    it('ignores clicks on elements without data-edataid', () => {
      render(
        <TelemetryProvider>
          <TestChild />
        </TelemetryProvider>
      );

      fireEvent.click(screen.getByTestId('non-interactive-btn'));

      expect(telemetryService.interact).not.toHaveBeenCalled();
    });

    it('removes event listener on unmount', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(
        <TelemetryProvider>
          <TestChild />
        </TelemetryProvider>
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
      
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Telemetry Config', () => {
    it('passes tags containing the channel', () => {
      render(<TelemetryProvider><TestChild /></TelemetryProvider>);
      const config = (telemetryService.initialize as any).mock.calls[0][0];
      expect(Array.isArray(config.tags)).toBe(true);
      expect(config.tags).toContain(config.channel);
    });

    it('passes cdata with UserSession entry containing the session id', () => {
      sessionStorage.setItem('sid', 'my-session-123');
      render(<TelemetryProvider><TestChild /></TelemetryProvider>);
      const config = (telemetryService.initialize as any).mock.calls[0][0];
      const userSessionEntry = config.cdata.find((c: any) => c.type === 'UserSession');
      expect(userSessionEntry).toBeDefined();
      expect(userSessionEntry.id).toBe('my-session-123');
    });

    it('passes cdata with Device entry (Desktop or Mobile)', () => {
      render(<TelemetryProvider><TestChild /></TelemetryProvider>);
      const config = (telemetryService.initialize as any).mock.calls[0][0];
      const deviceEntry = config.cdata.find((c: any) => c.type === 'Device');
      expect(deviceEntry).toBeDefined();
      expect(['Desktop', 'Mobile']).toContain(deviceEntry.id);
    });

    it('passes rollup with l1 equal to the channel', () => {
      render(<TelemetryProvider><TestChild /></TelemetryProvider>);
      const config = (telemetryService.initialize as any).mock.calls[0][0];
      expect(config.rollup).toBeDefined();
      expect(config.rollup.l1).toBe(config.channel);
    });

    it('passes enableValidation as a boolean', () => {
      render(<TelemetryProvider><TestChild /></TelemetryProvider>);
      const config = (telemetryService.initialize as any).mock.calls[0][0];
      expect(typeof config.enableValidation).toBe('boolean');
    });
  });
});
