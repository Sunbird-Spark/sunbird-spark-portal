import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('QumlEditor - FancyTree Guard & Re-initialization', () => {
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

  it('stores jQuery reference with FancyTree after initialization', async () => {
    const mockJQuery = { fn: { fancytree: vi.fn() } };
    (globalThis as any).$ = mockJQuery;

    render(<QumlEditor metadata={mockMetadata} />, { wrapper: createWrapper() });

    expect(mockLoadAssets).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(mockServiceInstance.initializeDependencies).toHaveBeenCalled();
    });
  });

  it('sets up FancyTree guard via property setter trap', async () => {
    const mockJQuery = { fn: { fancytree: vi.fn() } };
    (globalThis as any).$ = mockJQuery;

    render(<QumlEditor metadata={mockMetadata} />, { wrapper: createWrapper() });

    // Wait for the guard useEffect to fire after status becomes 'ready'
    await waitFor(() => {
      const desc = Object.getOwnPropertyDescriptor(globalThis, '$');
      expect(desc?.set).toBeDefined();
    });
  });

  it('restores jQuery when FancyTree is lost via setter trap', async () => {
    const mockJQueryWithFancytree = { fn: { fancytree: vi.fn() } };
    (globalThis as any).$ = mockJQueryWithFancytree;

    render(<QumlEditor metadata={mockMetadata} />, { wrapper: createWrapper() });

    // Wait for the guard to be installed
    await waitFor(() => {
      const desc = Object.getOwnPropertyDescriptor(globalThis, '$');
      expect(desc?.set).toBeDefined();
    });

    // Simulate FancyTree being lost — the setter trap fires synchronously
    (globalThis as any).$ = { fn: {} };

    // jQuery should be restored immediately by the setter trap
    expect((globalThis as any).$.fn.fancytree).toBeDefined();
  });

  it('does not restore jQuery if FancyTree is still available', async () => {
    const mockJQuery = { fn: { fancytree: vi.fn() } };
    (globalThis as any).$ = mockJQuery;

    render(<QumlEditor metadata={mockMetadata} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockServiceInstance.createElement).toHaveBeenCalled();
    });

    const originalJQuery = (globalThis as any).$;

    // Wait for a guard interval cycle
    await new Promise(resolve => setTimeout(resolve, 1000));

    // jQuery should remain unchanged
    expect((globalThis as any).$).toBe(originalJQuery);
  });

  it('re-initializes when metadata changes', async () => {
    const { rerender } = render(<QumlEditor metadata={mockMetadata} />, { wrapper: createWrapper() });

    await waitFor(() => expect(mockServiceInstance.createConfig).toHaveBeenCalledTimes(1));

    const newMetadata = { ...mockMetadata, identifier: 'do_456' };
    rerender(<QumlEditor metadata={newMetadata} />);

    await waitFor(() => expect(mockServiceInstance.createConfig).toHaveBeenCalledTimes(2));
  });

  it('re-initializes when mode changes', async () => {
    const { rerender } = render(
      <QumlEditor metadata={mockMetadata} mode="edit" />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(mockServiceInstance.createConfig).toHaveBeenCalledTimes(1));

    rerender(<QumlEditor metadata={mockMetadata} mode="review" />);

    await waitFor(() => expect(mockServiceInstance.createConfig).toHaveBeenCalledTimes(2));
  });

  it('re-initializes when contextOverrides change', async () => {
    const { rerender } = render(
      <QumlEditor metadata={mockMetadata} contextOverrides={{ mode: 'edit' }} />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(mockServiceInstance.createConfig).toHaveBeenCalledTimes(1));

    rerender(<QumlEditor metadata={mockMetadata} contextOverrides={{ mode: 'review' }} />);

    await waitFor(() => expect(mockServiceInstance.createConfig).toHaveBeenCalledTimes(2));
  });

  it('cleans up previous editor before re-initialization', async () => {
    const { rerender } = render(<QumlEditor metadata={mockMetadata} />, { wrapper: createWrapper() });

    await waitFor(() => expect(mockServiceInstance.createElement).toHaveBeenCalledTimes(1));

    const newMetadata = { ...mockMetadata, identifier: 'do_789' };
    rerender(<QumlEditor metadata={newMetadata} />);

    await waitFor(() => {
      expect(mockServiceInstance.removeEventListeners).toHaveBeenCalled();
      expect(mockServiceInstance.createElement).toHaveBeenCalledTimes(2);
    });
  });

  it('handles rapid metadata changes gracefully', async () => {
    const { rerender } = render(<QumlEditor metadata={mockMetadata} />, { wrapper: createWrapper() });

    for (let i = 0; i < 5; i++) {
      const newMeta = { ...mockMetadata, identifier: `do_${i}` };
      rerender(<QumlEditor metadata={newMeta} />);
    }

    await waitFor(() => {
      expect(mockServiceInstance.createConfig).toHaveBeenCalled();
    });
  });

  it('does not call createConfig if metadata is undefined', async () => {
    const { rerender } = render(<QumlEditor metadata={mockMetadata} />, { wrapper: createWrapper() });

    await waitFor(() => expect(mockServiceInstance.createConfig).toHaveBeenCalledTimes(1));

    rerender(<QumlEditor metadata={undefined} />);

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockServiceInstance.createConfig).toHaveBeenCalledTimes(1);
  });

  it('merges mode and contextOverrides correctly', async () => {
    render(
      <QumlEditor
        metadata={mockMetadata}
        mode="review"
        contextOverrides={{ cdata: [{ id: 'test' }] }}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(mockServiceInstance.createConfig).toHaveBeenCalledWith(
        mockMetadata,
        expect.objectContaining({
          mode: 'review',
          cdata: [{ id: 'test' }],
        })
      );
    });
  });
});
