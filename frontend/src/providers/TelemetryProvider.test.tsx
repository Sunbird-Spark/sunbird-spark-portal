import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TelemetryProvider, TelemetryContext } from './TelemetryProvider';
import { telemetryService } from '../services/TelemetryService';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';

vi.mock('../services/TelemetryService', () => ({
  telemetryService: {
    isInitialized: false,
    initialize: vi.fn(),
    interact: vi.fn(),
    end: vi.fn(),
  },
}));

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: {
    getUserId: vi.fn(() => 'test-user-id'),
    getSessionId: vi.fn(() => 'test-session'),
  },
}));

vi.mock('@/services/AppCoreService', () => ({
  default: {
    getPData: vi.fn().mockResolvedValue({ id: 'test-app', ver: '1.0.0', pid: 'test-app' }),
    getDeviceId: vi.fn().mockResolvedValue('test-device'),
  },
}));

vi.mock('@/services/UserProfileService', () => ({
  default: {
    getChannel: vi.fn().mockResolvedValue('test-channel'),
  },
}));

// Use regular functions (not arrow functions) so Vitest can call them with `new`
vi.mock('@/services/OrganizationService', () => ({
  OrganizationService: vi.fn(function (this: any) {
    this.search = vi.fn().mockResolvedValue({
      data: { response: { content: [{ hashTagId: 'test-channel', channel: 'test-channel' }] } },
      headers: { date: new Date().toUTCString() },
      status: 200,
    });
  }),
}));

vi.mock('@/services/SystemSettingService', () => ({
  SystemSettingService: vi.fn(function (this: any) {
    this.read = vi.fn().mockResolvedValue({
      data: { response: { value: 'sunbird' } },
      status: 200,
    });
  }),
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

  it('initializes telemetryService when mounted if not already initialized', async () => {
    render(
      <TelemetryProvider>
        <TestChild />
      </TelemetryProvider>
    );

    await waitFor(() => {
      expect(telemetryService.initialize).toHaveBeenCalled();
    });
  });

  it('does not re-initialize telemetryService if already initialized', async () => {
    Object.defineProperty(telemetryService, 'isInitialized', { value: true, writable: true });

    render(
      <TelemetryProvider>
        <TestChild />
      </TelemetryProvider>
    );

    await new Promise(r => setTimeout(r, 50));
    expect(telemetryService.initialize).not.toHaveBeenCalled();
  });

  it('computes telemetryConfig correctly with real service values', async () => {
    render(
      <TelemetryProvider>
        <TestChild />
      </TelemetryProvider>
    );

    await waitFor(() => {
      expect(telemetryService.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          did: 'test-device',
          uid: 'test-user-id',
          sid: 'test-session',
        })
      );
    });
  });

  it('computes telemetryConfig correctly for anonymous user', async () => {
    (userAuthInfoService.getUserId as any).mockReturnValue(null);
    (userAuthInfoService.getSessionId as any).mockReturnValue(null);

    render(
      <TelemetryProvider>
        <TestChild />
      </TelemetryProvider>
    );

    await waitFor(() => {
      expect(telemetryService.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: 'anonymous',
        })
      );
    });
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
    it('passes tags containing the channel', async () => {
      render(<TelemetryProvider><TestChild /></TelemetryProvider>);
      await waitFor(() => expect(telemetryService.initialize).toHaveBeenCalled());
      const config = (telemetryService.initialize as any).mock.calls[0][0];
      expect(Array.isArray(config.tags)).toBe(true);
      expect(config.tags).toContain(config.channel);
    });

    it('passes cdata with UserSession entry containing the session id', async () => {
      (userAuthInfoService.getSessionId as any).mockReturnValue('my-session-123');
      render(<TelemetryProvider><TestChild /></TelemetryProvider>);
      await waitFor(() => expect(telemetryService.initialize).toHaveBeenCalled());
      const config = (telemetryService.initialize as any).mock.calls[0][0];
      const userSessionEntry = config.cdata.find((c: any) => c.type === 'UserSession');
      expect(userSessionEntry).toBeDefined();
      expect(userSessionEntry.id).toBe('my-session-123');
    });

    it('passes cdata with Device entry (Desktop or Mobile)', async () => {
      render(<TelemetryProvider><TestChild /></TelemetryProvider>);
      await waitFor(() => expect(telemetryService.initialize).toHaveBeenCalled());
      const config = (telemetryService.initialize as any).mock.calls[0][0];
      const deviceEntry = config.cdata.find((c: any) => c.type === 'Device');
      expect(deviceEntry).toBeDefined();
      expect(['Desktop', 'Mobile']).toContain(deviceEntry.id);
    });

    it('passes rollup with l1 equal to the channel', async () => {
      render(<TelemetryProvider><TestChild /></TelemetryProvider>);
      await waitFor(() => expect(telemetryService.initialize).toHaveBeenCalled());
      const config = (telemetryService.initialize as any).mock.calls[0][0];
      expect(config.rollup).toBeDefined();
      expect(config.rollup.l1).toBe(config.channel);
    });

    it('passes enableValidation as a boolean', async () => {
      render(<TelemetryProvider><TestChild /></TelemetryProvider>);
      await waitFor(() => expect(telemetryService.initialize).toHaveBeenCalled());
      const config = (telemetryService.initialize as any).mock.calls[0][0];
      expect(typeof config.enableValidation).toBe('boolean');
    });
  });
});
