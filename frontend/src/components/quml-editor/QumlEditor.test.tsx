import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import QumlEditor from './QumlEditor';
import { QumlEditorService } from '../../services/editors/quml-editor';

vi.mock('../../services/editors/quml-editor', () => ({
  QumlEditorService: vi.fn(),
  QumlEditorConfig: {},
  QuestionSetMetadata: {},
  QumlEditorEvent: {},
  QumlEditorContextOverrides: {},
}));

const createWrapper = () => ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('QumlEditor', () => {
  const mockMetadata = {
    identifier: 'do_123',
    name: 'Test Question Set',
    primaryCategory: 'QuestionSet',
    objectType: 'QuestionSet',
    status: 'Draft',
    createdBy: 'user-1',
    channel: 'sunbird',
    mimeType: 'application/vnd.sunbird.questionset',
  } as any;

  const mockConfig = {
    context: { identifier: 'do_123' },
    config: { mode: 'edit' },
    metadata: mockMetadata,
  } as any;

  let mockElement: HTMLElement;
  let mockServiceInstance: any;
  let mockLoadAssets: ReturnType<typeof vi.fn>;
  let mockRemoveAssets: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).$ = { fn: { fancytree: vi.fn() } };
    mockElement = document.createElement('lib-questionset-editor');
    mockLoadAssets = vi.fn();
    mockRemoveAssets = vi.fn();

    mockServiceInstance = {
      initializeDependencies: vi.fn().mockResolvedValue(undefined),
      createConfig: vi.fn().mockResolvedValue(mockConfig),
      createElement: vi.fn().mockReturnValue(mockElement),
      attachEventListeners: vi.fn(),
      removeEventListeners: vi.fn(),
      loadAssets: mockLoadAssets,
      removeAssets: mockRemoveAssets,
    };

    (QumlEditorService as any).mockImplementation(function() {
      return mockServiceInstance;
    });
  });

  it('initializes dependencies on mount', async () => {
    render(<QumlEditor metadata={mockMetadata} />, { wrapper: createWrapper() });

    expect(mockLoadAssets).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(mockServiceInstance.initializeDependencies).toHaveBeenCalled();
    });
  });

  it('creates config with provided metadata and options', async () => {
    render(
      <QumlEditor
        metadata={mockMetadata}
        mode="review"
        contextOverrides={{ mode: 'review' }}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(mockServiceInstance.createConfig).toHaveBeenCalledWith(
        mockMetadata,
        expect.objectContaining({ mode: 'review' })
      );
    });
  });

  it('creates and appends editor element', async () => {
    const { container } = render(<QumlEditor metadata={mockMetadata} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockServiceInstance.createElement).toHaveBeenCalledWith(mockConfig);
      expect(container.querySelector('lib-questionset-editor')).toBeTruthy();
    });
  });

  it('attaches event listeners with handlers', async () => {
    const onEditorEvent = vi.fn();
    const onTelemetryEvent = vi.fn();

    render(
      <QumlEditor
        metadata={mockMetadata}
        onEditorEvent={onEditorEvent}
        onTelemetryEvent={onTelemetryEvent}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(mockServiceInstance.attachEventListeners).toHaveBeenCalledWith(
        mockElement,
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  it('forwards editor events to consumer', async () => {
    const onEditorEvent = vi.fn();
    let capturedHandler: any;

    mockServiceInstance.attachEventListeners.mockImplementation((_el: any, handler: any) => {
      capturedHandler = handler;
    });

    render(<QumlEditor metadata={mockMetadata} onEditorEvent={onEditorEvent} />, { wrapper: createWrapper() });

    await waitFor(() => expect(capturedHandler).toBeDefined());

    const mockEvent = { type: 'submitContent', data: { id: 'x' } };
    capturedHandler(mockEvent);

    expect(onEditorEvent).toHaveBeenCalledWith(mockEvent);
  });

  it('forwards telemetry events to consumer', async () => {
    const onTelemetryEvent = vi.fn();
    let capturedTelemetryHandler: any;

    mockServiceInstance.attachEventListeners.mockImplementation((_el: any, _editor: any, telemetry: any) => {
      capturedTelemetryHandler = telemetry;
    });

    render(<QumlEditor metadata={mockMetadata} onTelemetryEvent={onTelemetryEvent} />, { wrapper: createWrapper() });

    await waitFor(() => expect(capturedTelemetryHandler).toBeDefined());

    const mockTelemetry = { eid: 'INTERACT', edata: {} };
    capturedTelemetryHandler(mockTelemetry);

    expect(onTelemetryEvent).toHaveBeenCalledWith(mockTelemetry);
  });

  it('shows loading state initially', () => {
    const { container } = render(<QumlEditor metadata={mockMetadata} />, { wrapper: createWrapper() });
    expect(container.textContent).toContain('Loading Editor');
  });

  it('does not initialize without metadata', async () => {
    render(<QumlEditor />, { wrapper: createWrapper() });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockServiceInstance.initializeDependencies).not.toHaveBeenCalled();
  });

  it('handles initialization errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockServiceInstance.initializeDependencies.mockRejectedValue(new Error('Init failed'));

    render(<QumlEditor metadata={mockMetadata} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        '[QumlEditor] Failed to initialize editor:',
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });

  it('cleans up listeners and element on unmount', async () => {
    const { unmount } = render(<QumlEditor metadata={mockMetadata} />, { wrapper: createWrapper() });

    await waitFor(() => expect(mockServiceInstance.createElement).toHaveBeenCalled());

    unmount();

    expect(mockServiceInstance.removeEventListeners).toHaveBeenCalledWith(mockElement);
    expect(mockRemoveAssets).toHaveBeenCalledTimes(1);
  });

  it('clears FancyTree guard interval on unmount', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { unmount } = render(<QumlEditor metadata={mockMetadata} />, { wrapper: createWrapper() });

    await waitFor(() => expect(mockServiceInstance.createElement).toHaveBeenCalled());

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });
});
