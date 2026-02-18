import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { VideoPlayer } from './VideoPlayer';
import type { VideoPlayerMetadata } from '../../services/players/video';

// Create mock service methods
const mockCreateConfig = vi.fn();
const mockCreateElement = vi.fn();
const mockAttachEventListeners = vi.fn();
const mockRemoveEventListeners = vi.fn();

// Mock the VideoPlayerService
vi.mock('../../services/players/video', () => {
  const MockVideoPlayerService = vi.fn(function(this: any) {
    this.createConfig = mockCreateConfig;
    this.createElement = mockCreateElement;
    this.attachEventListeners = mockAttachEventListeners;
    this.removeEventListeners = mockRemoveEventListeners;
  });
  
  MockVideoPlayerService.unloadStyles = vi.fn();
  
  return {
    VideoPlayerService: MockVideoPlayerService,
  };
});

describe('VideoPlayer', () => {
  let mockPlayerElement: HTMLElement;

  const mockMetadata: VideoPlayerMetadata = {
    identifier: 'test-video-123',
    name: 'Test Video Content',
    artifactUrl: 'https://example.com/video.mp4',
    streamingUrl: 'https://example.com/stream/video.m3u8',
  };

  beforeEach(() => {
    // Create mock player element
    mockPlayerElement = document.createElement('div');
    mockPlayerElement.setAttribute('data-player-id', 'test-video-123');

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
    const { container } = render(<VideoPlayer metadata={mockMetadata} />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('should create config with metadata only when no optional props provided', async () => {
    render(<VideoPlayer metadata={mockMetadata} />);

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
      <VideoPlayer
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
    const { container } = render(<VideoPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(mockCreateElement).toHaveBeenCalled();
      expect(container.querySelector('div')?.contains(mockPlayerElement)).toBe(true);
    });
  });

  it('should attach event listeners', async () => {
    const onPlayerEvent = vi.fn();
    const onTelemetryEvent = vi.fn();

    render(
      <VideoPlayer
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

    render(<VideoPlayer metadata={mockMetadata} onPlayerEvent={onPlayerEvent} />);

    await waitFor(() => {
      expect(mockAttachEventListeners).toHaveBeenCalled();
    });

    // Simulate player event
    const mockEvent = { type: 'START', data: {}, playerId: 'test', timestamp: Date.now() };
    capturedHandler(mockEvent);

    expect(onPlayerEvent).toHaveBeenCalledWith(mockEvent);
  });

  it('should cleanup on unmount', async () => {
    const { unmount } = render(<VideoPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(mockCreateElement).toHaveBeenCalled();
    });

    unmount();

    expect(mockRemoveEventListeners).toHaveBeenCalledWith(mockPlayerElement);
  });

  it('should handle initialization errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateConfig.mockRejectedValue(new Error('Failed to create config'));

    render(<VideoPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize video player:',
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

    const { unmount } = render(<VideoPlayer metadata={mockMetadata} />);

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
      <VideoPlayer
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
    const { rerender } = render(<VideoPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledTimes(1);
    });

    const newMetadata = { ...mockMetadata, identifier: 'new-video-456' };
    rerender(<VideoPlayer metadata={newMetadata} />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledTimes(2);
      expect(mockCreateConfig).toHaveBeenCalledWith(newMetadata, undefined);
    });
  });

  it('should re-initialize player when optional props change', async () => {
    const { rerender } = render(<VideoPlayer metadata={mockMetadata} mode="play" />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledTimes(1);
    });

    rerender(<VideoPlayer metadata={mockMetadata} mode="preview" />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledTimes(2);
    });
  });
});
