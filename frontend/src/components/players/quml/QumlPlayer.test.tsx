import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import QumlPlayer from './QumlPlayer';
import { qumlPlayerService } from '../../../services/players/quml/QumlPlayerService';
import type { QumlPlayerConfig } from '../../../services/players/quml/types';

// Mock the QumlPlayerService
vi.mock('../../../services/players/quml/QumlPlayerService', () => ({
  qumlPlayerService: {
    createConfig: vi.fn(),
    createElement: vi.fn(),
    attachEventListeners: vi.fn(),
    removeEventListeners: vi.fn(),
  },
  QumlPlayerService: class {
    static unloadStyles = vi.fn();
  },
}));

const mockMetadata = {
  identifier: 'do_123',
  name: 'Test Question Set',
  mimeType: 'application/vnd.sunbird.questionset',
  channel: 'test-channel',
  children: [
    {
      identifier: 'do_q1',
      name: 'Question 1',
      mimeType: 'application/vnd.sunbird.question',
      body: '<p>What is 2+2?</p>',
    },
  ],
};

const mockConfig: QumlPlayerConfig = {
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
    contextRollup: { l1: 'test-channel' },
    cdata: [],
    timeDiff: 0,
    objectRollup: {},
    host: '',
    endpoint: '',
  },
  config: {},
  metadata: mockMetadata,
};

describe('QumlPlayer', () => {
  let mockPlayerElement: HTMLElement;

  beforeEach(() => {
    // Create a mock player element
    mockPlayerElement = document.createElement('sunbird-quml-player');
    mockPlayerElement.setAttribute('data-player-id', 'do_123');

    // Setup mocks
    vi.mocked(qumlPlayerService.createConfig).mockResolvedValue(mockConfig);
    vi.mocked(qumlPlayerService.createElement).mockReturnValue(mockPlayerElement);
    vi.mocked(qumlPlayerService.attachEventListeners).mockImplementation(() => {});
    vi.mocked(qumlPlayerService.removeEventListeners).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render container div', () => {
    const { container } = render(<QumlPlayer metadata={mockMetadata} />);
    // The component renders a div with ref, just check it exists
    const playerContainers = container.querySelectorAll('div');
    expect(playerContainers.length).toBeGreaterThan(0);
  });

  it('should create player config on mount', async () => {
    render(<QumlPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(qumlPlayerService.createConfig).toHaveBeenCalledWith(
        mockMetadata,
        expect.objectContaining({
          mode: 'play',
        })
      );
    });
  });

  it('should create player element with config', async () => {
    render(<QumlPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(qumlPlayerService.createElement).toHaveBeenCalledWith(mockConfig);
    });
  });

  it('should attach event listeners', async () => {
    const onPlayerEvent = vi.fn();
    const onTelemetryEvent = vi.fn();

    render(
      <QumlPlayer
        metadata={mockMetadata}
        onPlayerEvent={onPlayerEvent}
        onTelemetryEvent={onTelemetryEvent}
      />
    );

    await waitFor(() => {
      expect(qumlPlayerService.attachEventListeners).toHaveBeenCalledWith(
        mockPlayerElement,
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  it('should pass context props to createConfig', async () => {
    const contextProps = {
      mode: 'review',
      cdata: [{ id: 'test', type: 'Course' }],
      contextRollup: { l1: 'org-123' },
      objectRollup: { l1: 'content-123' },
    };

    render(<QumlPlayer metadata={mockMetadata} {...contextProps} />);

    await waitFor(() => {
      expect(qumlPlayerService.createConfig).toHaveBeenCalledWith(
        mockMetadata,
        expect.objectContaining(contextProps)
      );
    });
  });

  it('should cleanup on unmount', async () => {
    const { unmount } = render(<QumlPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(qumlPlayerService.createElement).toHaveBeenCalled();
    });

    unmount();

    expect(qumlPlayerService.removeEventListeners).toHaveBeenCalledWith(mockPlayerElement);
  });

  it('should handle player initialization error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(qumlPlayerService.createConfig).mockRejectedValue(new Error('Config failed'));

    render(<QumlPlayer metadata={mockMetadata} />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        '[QumlPlayer] Failed to initialize player:',
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });

  it('should call onPlayerEvent when player emits event', async () => {
    const onPlayerEvent = vi.fn();
    let capturedPlayerHandler: ((event: any) => void) | undefined;

    vi.mocked(qumlPlayerService.attachEventListeners).mockImplementation(
      (element, playerHandler) => {
        capturedPlayerHandler = playerHandler;
      }
    );

    render(<QumlPlayer metadata={mockMetadata} onPlayerEvent={onPlayerEvent} />);

    await waitFor(() => {
      expect(capturedPlayerHandler).toBeDefined();
    });

    // Simulate player event
    if (capturedPlayerHandler) {
      capturedPlayerHandler({
        type: 'SCORE',
        data: { score: 10 },
        playerId: 'do_123',
        timestamp: Date.now(),
      });
    }

    expect(onPlayerEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'SCORE',
        data: { score: 10 },
      })
    );
  });

  it('should call onTelemetryEvent when player emits telemetry', async () => {
    const onTelemetryEvent = vi.fn();
    let capturedTelemetryHandler: ((event: any) => void) | undefined;

    vi.mocked(qumlPlayerService.attachEventListeners).mockImplementation(
      (element, playerHandler, telemetryHandler) => {
        capturedTelemetryHandler = telemetryHandler;
      }
    );

    render(<QumlPlayer metadata={mockMetadata} onTelemetryEvent={onTelemetryEvent} />);

    await waitFor(() => {
      expect(capturedTelemetryHandler).toBeDefined();
    });

    // Simulate telemetry event
    if (capturedTelemetryHandler) {
      capturedTelemetryHandler({ eid: 'INTERACT', data: {} });
    }

    expect(onTelemetryEvent).toHaveBeenCalledWith({ eid: 'INTERACT', data: {} });
  });
});
