import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import CollectionEditor from './CollectionEditor';

const mockInitializeDependencies = vi.fn().mockResolvedValue(undefined);
const mockCreateConfig = vi.fn().mockResolvedValue({ 
  context: { identifier: 'do_123', mode: 'edit' }, 
  config: { showAddCollaborator: true }, 
  metadata: { identifier: 'do_123' } 
});
const mockCreateElement = vi.fn().mockReturnValue(document.createElement('lib-editor'));
const mockAttachEventListeners = vi.fn();
const mockRemoveEventListeners = vi.fn();

vi.mock('../../services/editors/collection-editor', () => {
  class MockCollectionEditorService {
    initializeDependencies = mockInitializeDependencies;
    createConfig = mockCreateConfig;
    createElement = mockCreateElement;
    attachEventListeners = mockAttachEventListeners;
    removeEventListeners = mockRemoveEventListeners;
  }

  return {
    CollectionEditorService: MockCollectionEditorService,
    CollectionEditorContextProps: {},
  };
});

describe('CollectionEditor - Basic Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInitializeDependencies.mockResolvedValue(undefined);
    mockCreateConfig.mockResolvedValue({ 
      context: { identifier: 'do_123', mode: 'edit' }, 
      config: { showAddCollaborator: true }, 
      metadata: { identifier: 'do_123' } 
    });
    mockCreateElement.mockReturnValue(document.createElement('lib-editor'));
  });

  it('initializes editor with metadata and contextProps', async () => {
    const { container } = render(
      <CollectionEditor 
        identifier="do_123" 
        metadata={{ identifier: 'do_123', name: 'Test Collection' }} 
        contextProps={{ mode: 'edit' }}
      />
    );

    await waitFor(() => {
      const editorContainer = container.querySelector('#collection-editor-container');
      expect(editorContainer).toBeTruthy();
    });

    expect(mockInitializeDependencies).toHaveBeenCalledTimes(1);
    expect(mockCreateConfig).toHaveBeenCalledWith(
      { identifier: 'do_123', name: 'Test Collection' },
      { mode: 'edit' }
    );
    expect(mockCreateElement).toHaveBeenCalled();
    expect(mockAttachEventListeners).toHaveBeenCalled();
  });

  it('displays loading state initially', () => {
    render(
      <CollectionEditor 
        identifier="do_123" 
        metadata={{ identifier: 'do_123' }} 
        contextProps={{ mode: 'edit' }}
      />
    );

    expect(screen.getByText('Loading Editor...')).toBeInTheDocument();
  });

  it('handles initialization error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockInitializeDependencies.mockRejectedValue(new Error('Failed to load dependencies'));

    render(
      <CollectionEditor 
        identifier="do_123" 
        metadata={{ identifier: 'do_123' }} 
        contextProps={{ mode: 'edit' }}
      />
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to initialize Collection Editor:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('handles createConfig error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateConfig.mockRejectedValue(new Error('Config creation failed'));

    render(
      <CollectionEditor 
        identifier="do_123" 
        metadata={{ identifier: 'do_123' }} 
        contextProps={{ mode: 'edit' }}
      />
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to initialize Collection Editor:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('cleans up event listeners on unmount', async () => {
    const { unmount } = render(
      <CollectionEditor 
        identifier="do_123" 
        metadata={{ identifier: 'do_123' }} 
        contextProps={{ mode: 'edit' }}
      />
    );

    await waitFor(() => {
      expect(mockAttachEventListeners).toHaveBeenCalled();
    });

    unmount();

    expect(mockRemoveEventListeners).toHaveBeenCalled();
  });

  it('skips initialization if container is not available', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(
      <CollectionEditor 
        identifier="do_123" 
        metadata={null as any} 
        contextProps={{ mode: 'edit' }}
      />
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('[QumlPlayer] Container or metadata not available');
    });

    expect(mockInitializeDependencies).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});

