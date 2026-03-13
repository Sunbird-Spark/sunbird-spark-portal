import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PdfPlayer } from './PdfPlayer';
import type { PdfPlayerMetadata, PdfPlayerConfig } from '../../../services/players/pdf/types';

// Create mock functions
const mockCreateConfig = vi.fn();
const mockCreateElement = vi.fn();
const mockAttachEventListeners = vi.fn();
const mockRemoveEventListeners = vi.fn();

// Mock the PdfPlayerService module
vi.mock('../../../services/players/pdf/PdfPlayerService', () => {
  const MockPdfPlayerService: any = vi.fn(function(this: any) {
    this.createConfig = mockCreateConfig;
    this.createElement = mockCreateElement;
    this.attachEventListeners = mockAttachEventListeners;
    this.removeEventListeners = mockRemoveEventListeners;
  });
  
  MockPdfPlayerService.unloadStyles = vi.fn();
  
  return {
    PdfPlayerService: MockPdfPlayerService,
  };
});

describe('PdfPlayer Component', () => {
  const mockMetadata: PdfPlayerMetadata = {
    identifier: 'test-pdf-123',
    name: 'Test PDF Document',
    artifactUrl: 'https://example.com/test.pdf',
    streamingUrl: 'https://example.com/test.pdf',
    compatibilityLevel: 4,
    pkgVersion: 1,
  };

  const mockConfig: PdfPlayerConfig = {
    context: {
      mode: 'play',
      sid: 'session-123',
      did: 'device-123',
      uid: 'user-123',
      channel: 'test-channel',
      pdata: {
        id: 'sunbird.portal',
        ver: '3.2.12',
        pid: 'sunbird-portal.contentplayer',
      },
      contextRollup: {
        l1: 'test-channel',
      },
      cdata: [],
      timeDiff: 0,
      objectRollup: {},
      host: '',
      endpoint: '',
    },
    config: {},
    metadata: mockMetadata,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock returns
    mockCreateConfig.mockResolvedValue(mockConfig);
    mockCreateElement.mockReturnValue(document.createElement('sunbird-pdf-player'));
  });

  it('should render container div', () => {
    const { container } = render(<PdfPlayer metadata={mockMetadata} />);
    const div = container.querySelector('div');
    expect(div).toBeInTheDocument();
    expect(div).toHaveClass('content-player-embed');
  });

  it('should initialize player with metadata', async () => {
    render(<PdfPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledWith(mockMetadata, undefined);
      expect(mockCreateElement).toHaveBeenCalled();
      expect(mockAttachEventListeners).toHaveBeenCalled();
    });
  });

  it('should pass context props to createConfig', async () => {
    const contextProps = {
      mode: 'edit',
      cdata: [{ id: 'test', type: 'test' }],
      contextRollup: { l1: 'custom-channel' },
    };

    render(<PdfPlayer metadata={mockMetadata} {...contextProps} />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledWith(
        mockMetadata,
        expect.objectContaining({
          mode: 'edit',
          cdata: contextProps.cdata,
          contextRollup: contextProps.contextRollup,
        })
      );
    });
  });

  it('should create config without options', async () => {
    render(<PdfPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledWith(mockMetadata, undefined);
    });
  });

  it('should attach event listeners with handlers', async () => {
    const onPlayerEvent = vi.fn();
    const onTelemetryEvent = vi.fn();

    render(
      <PdfPlayer
        metadata={mockMetadata}
        onPlayerEvent={onPlayerEvent}
        onTelemetryEvent={onTelemetryEvent}
      />
    );

    await waitFor(() => {
      expect(mockAttachEventListeners).toHaveBeenCalled();
    });

    const calls = mockAttachEventListeners.mock.calls[0];
    expect(calls).toBeDefined();
    const [element, playerHandler, telemetryHandler] = calls!;
    expect(element).toBeInstanceOf(HTMLElement);
    expect(typeof playerHandler).toBe('function');
    expect(typeof telemetryHandler).toBe('function');
  });

  it('should cleanup on unmount', async () => {
    const { unmount } = render(<PdfPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(mockCreateElement).toHaveBeenCalled();
    });

    const playerElement = mockCreateElement.mock.results[0]?.value;
    unmount();

    expect(mockRemoveEventListeners).toHaveBeenCalledWith(playerElement);
  });

  it('should handle initialization errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateConfig.mockRejectedValue(new Error('Config creation failed'));

    render(<PdfPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to initialize PDF player:',
        expect.any(Error)
      );
    });

    expect(mockCreateElement).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('should not initialize if unmounted during async operations', async () => {
    mockCreateConfig.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { unmount } = render(<PdfPlayer metadata={mockMetadata} />);
    unmount();

    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(mockCreateElement).not.toHaveBeenCalled();
  });

  it('should only create contextProps when optional params are provided', async () => {
    // Without optional params
    const { rerender } = render(<PdfPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledWith(mockMetadata, undefined);
    });

    // With optional params
    rerender(<PdfPlayer metadata={mockMetadata} mode="edit" />);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledWith(
        mockMetadata,
        expect.objectContaining({ mode: 'edit' })
      );
    });
  });
});
