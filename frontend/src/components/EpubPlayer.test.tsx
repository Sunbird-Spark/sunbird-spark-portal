import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { EpubPlayer } from './EpubPlayer';
import type { EpubPlayerMetadata } from '../services/players/epub';

// Create mock service methods
const mockCreateConfig = vi.fn();
const mockCreateElement = vi.fn();
const mockAttachEventListeners = vi.fn();
const mockRemoveEventListeners = vi.fn();

// Mock the EpubPlayerService
vi.mock('../services/players/epub', () => ({
  EpubPlayerService: class {
    createConfig = mockCreateConfig;
    createElement = mockCreateElement;
    attachEventListeners = mockAttachEventListeners;
    removeEventListeners = mockRemoveEventListeners;
  },
}));

describe('EpubPlayer', () => {
  let mockPlayerElement: HTMLElement;

  const mockMetadata: EpubPlayerMetadata = {
    identifier: 'test-content-123',
    name: 'Test EPUB Book',
    artifactUrl: 'https://example.com/book.epub',
  };

  beforeEach(() => {
    // Create mock player element
    mockPlayerElement = document.createElement('div');
    mockPlayerElement.setAttribute('data-player-id', 'test-content-123');

    // Setup default mock behavior
    mockCreateConfig.mockResolvedValue({
      context: { mode: 'play' },
      config: {},
      metadata: mockMetadata,
    });
    mockCreateElement.mockReturnValue(mockPlayerElement);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(<EpubPlayer metadata={mockMetadata} />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('should create config with metadata only when no optional props provided', async () => {
    render(<EpubPlayer metadata={mockMetadata} />);

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
      <EpubPlayer
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

  it('should create player element and append to container', async () => {
    const { container } = render(<EpubPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(mockCreateElement).toHaveBeenCalled();
      expect(container.querySelector('div')?.contains(mockPlayerElement)).toBe(true);
    });
  });

  it('should attach event listeners', async () => {
    const onPlayerEvent = vi.fn();
    const onTelemetryEvent = vi.fn();

    render(
      <EpubPlayer
        metadata={mockMetadata}
        onPlayerEvent={onPlayerEvent}
        onTelemetryEvent={onTelemetryEvent}
      />
    );

    await waitFor(() => {
      expect(mockAttachEventListeners).toHaveBeenCalledWith(
        mockPlayerElement,
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  it('should call onPlayerEvent when player event is triggered', async () => {
    const onPlayerEvent = vi.fn();
    let capturedHandler: any;

    mockAttachEventListeners.mockImplementation((_element: any, handler: any) => {
      capturedHandler = handler;
    });

    render(<EpubPlayer metadata={mockMetadata} onPlayerEvent={onPlayerEvent} />);

    await waitFor(() => {
      expect(mockAttachEventListeners).toHaveBeenCalled();
    });

    // Simulate player event
    const mockEvent = { type: 'START', data: {}, playerId: 'test', timestamp: Date.now() };
    capturedHandler(mockEvent);

    expect(onPlayerEvent).toHaveBeenCalledWith(mockEvent);
  });

  it('should cleanup on unmount', async () => {
    const { unmount } = render(<EpubPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(mockCreateElement).toHaveBeenCalled();
    });

    unmount();

    expect(mockRemoveEventListeners).toHaveBeenCalledWith(mockPlayerElement);
  });

  it('should handle initialization errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateConfig.mockRejectedValue(new Error('Failed to create config'));

    render(<EpubPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize EPUB player:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should not append player if component unmounts before config is created', async () => {
    let resolveConfig: any;
    mockCreateConfig.mockReturnValue(
      new Promise((resolve) => {
        resolveConfig = resolve;
      })
    );

    const { unmount } = render(<EpubPlayer metadata={mockMetadata} />);

    // Unmount before config resolves
    unmount();

    // Resolve config after unmount
    resolveConfig({
      context: { mode: 'play' },
      config: {},
      metadata: mockMetadata,
    });

    await waitFor(() => {
      expect(mockCreateElement).not.toHaveBeenCalled();
    });
  });

  it('should only include defined optional props in contextProps', async () => {
    render(
      <EpubPlayer
        metadata={mockMetadata}
        mode="play"
        // cdata, contextRollup, objectRollup not provided
      />
    );

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledWith(mockMetadata, {
        mode: 'play',
      });
    });
  });

  it('should re-initialize player when metadata changes', async () => {
    const { rerender } = render(<EpubPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledTimes(1);
    });

    const newMetadata = { ...mockMetadata, identifier: 'new-content-456' };
    rerender(<EpubPlayer metadata={newMetadata} />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledTimes(2);
      expect(mockCreateConfig).toHaveBeenCalledWith(newMetadata, undefined);
    });
  });

  it('should re-initialize player when optional props change', async () => {
    const { rerender } = render(<EpubPlayer metadata={mockMetadata} mode="play" />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledTimes(1);
    });

    rerender(<EpubPlayer metadata={mockMetadata} mode="preview" />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledTimes(2);
    });
  });
});
