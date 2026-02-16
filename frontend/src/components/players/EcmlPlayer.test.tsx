import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { EcmlPlayer } from './EcmlPlayer';
import type { EcmlPlayerMetadata } from '../../services/players/ecml';

const mockCreateConfig = vi.fn();
const mockBuildPlayerUrl = vi.fn();

vi.mock('../../services/players/ecml', () => {
  const MockEcmlPlayerService = vi.fn(function (this: any) {
    this.createConfig = mockCreateConfig;
    this.buildPlayerUrl = mockBuildPlayerUrl;
  });

  return {
    EcmlPlayerService: MockEcmlPlayerService,
  };
});

describe('EcmlPlayer', () => {
  const mockMetadata: EcmlPlayerMetadata = {
    identifier: 'test-ecml-123',
    name: 'Test ECML Content',
    artifactUrl: 'https://example.com/content.ecar',
  };

  const mockConfig = {
    context: { mode: 'play', contentId: 'test-ecml-123' },
    config: { apislug: '/action' },
    metadata: mockMetadata,
    data: {},
  };

  beforeEach(() => {
    mockCreateConfig.mockResolvedValue(mockConfig);
    mockBuildPlayerUrl.mockReturnValue('/content/preview/preview.html?webview=true');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render an iframe with correct attributes', () => {
    const { container } = render(<EcmlPlayer metadata={mockMetadata} />);
    const iframe = container.querySelector('iframe');

    expect(iframe).toBeInTheDocument();
    expect(iframe?.id).toBe('contentPlayer');
    expect(iframe?.name).toBe('contentPlayer');
    expect(iframe?.title).toBe('Content Player');
  });

  it('should create config with metadata only when no optional props', async () => {
    render(<EcmlPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledWith(mockMetadata, undefined);
    });
  });

  it('should create config with optional props when provided', async () => {
    const mode = 'preview';
    const cdata = [{ id: 'test', type: 'course' }];
    const contextRollup = { l1: 'test-channel' };
    const objectRollup = { l1: 'test-object' };

    render(
      <EcmlPlayer
        metadata={mockMetadata}
        mode={mode}
        cdata={cdata}
        contextRollup={contextRollup}
        objectRollup={objectRollup}
      />
    );

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledWith(mockMetadata, {
        mode,
        cdata,
        contextRollup,
        objectRollup,
      });
    });
  });

  it('should set iframe src from buildPlayerUrl', async () => {
    const { container } = render(<EcmlPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      const iframe = container.querySelector('iframe');
      expect(iframe?.src).toContain('/content/preview/preview.html?webview=true');
    });
  });

  it('should handle initialization errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateConfig.mockRejectedValue(new Error('Failed to create config'));

    render(<EcmlPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize ECML player:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should not set iframe src if component unmounts before config resolves', async () => {
    let resolveConfig: any;
    mockCreateConfig.mockReturnValue(
      new Promise((resolve) => {
        resolveConfig = resolve;
      })
    );

    const { unmount, container } = render(<EcmlPlayer metadata={mockMetadata} />);

    unmount();

    resolveConfig(mockConfig);

    await waitFor(() => {
      const iframe = container.querySelector('iframe');
      expect(iframe?.src || '').not.toContain('preview.html');
    });
  });

  it('should only include defined optional props in contextProps', async () => {
    render(<EcmlPlayer metadata={mockMetadata} mode="play" />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledWith(mockMetadata, {
        mode: 'play',
      });
    });
  });

  it('should cleanup message listener on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<EcmlPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalled();
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });

  it('should handle postMessage events from iframe', async () => {
    const onPlayerEvent = vi.fn();
    const onTelemetryEvent = vi.fn();

    render(
      <EcmlPlayer
        metadata={mockMetadata}
        onPlayerEvent={onPlayerEvent}
        onTelemetryEvent={onTelemetryEvent}
      />
    );

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalled();
    });

    // Simulate postMessage from iframe with eid (telemetry event)
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { eid: 'START', edata: { type: 'content' } },
      })
    );

    expect(onPlayerEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'START',
        playerId: 'test-ecml-123',
      })
    );
    expect(onTelemetryEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eid: 'START' })
    );
  });

  it('should handle postMessage with string data', async () => {
    const onPlayerEvent = vi.fn();

    render(<EcmlPlayer metadata={mockMetadata} onPlayerEvent={onPlayerEvent} />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalled();
    });

    window.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({ eid: 'END', edata: {} }),
      })
    );

    expect(onPlayerEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'END' })
    );
  });

  it('should ignore postMessage with empty data', async () => {
    const onPlayerEvent = vi.fn();

    render(<EcmlPlayer metadata={mockMetadata} onPlayerEvent={onPlayerEvent} />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalled();
    });

    window.dispatchEvent(new MessageEvent('message', { data: null }));

    expect(onPlayerEvent).not.toHaveBeenCalled();
  });

  it('should ignore postMessage with invalid JSON string', async () => {
    const onPlayerEvent = vi.fn();

    render(<EcmlPlayer metadata={mockMetadata} onPlayerEvent={onPlayerEvent} />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalled();
    });

    window.dispatchEvent(new MessageEvent('message', { data: 'not-json' }));

    expect(onPlayerEvent).not.toHaveBeenCalled();
  });

  it('should not call onTelemetryEvent when eid is missing', async () => {
    const onTelemetryEvent = vi.fn();

    render(
      <EcmlPlayer metadata={mockMetadata} onTelemetryEvent={onTelemetryEvent} />
    );

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalled();
    });

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { event: 'some-event', data: {} },
      })
    );

    expect(onTelemetryEvent).not.toHaveBeenCalled();
  });
});
