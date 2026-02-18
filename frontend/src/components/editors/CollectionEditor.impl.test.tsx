import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import CollectionEditor from './CollectionEditor';
const mockInitializeDependencies = vi.fn().mockResolvedValue(undefined);
const mockCreateConfig = vi.fn().mockResolvedValue({ context: { identifier: 'do_123', mode: 'edit' }, config: { showAddCollaborator: true }, metadata: { identifier: 'do_123' } });
const mockCreateElement = vi.fn().mockReturnValue(document.createElement('lib-editor'));
const mockAttachEventListeners = vi.fn();
const mockRemoveEventListeners = vi.fn();
const mockLoadAssets = vi.fn();
const mockRemoveAssets = vi.fn();
vi.mock('../../services/editors/collection-editor', () => {
  class MockCollectionEditorService {
    initializeDependencies = mockInitializeDependencies;
    createConfig = mockCreateConfig;
    createElement = mockCreateElement;
    attachEventListeners = mockAttachEventListeners;
    removeEventListeners = mockRemoveEventListeners;
    loadAssets = mockLoadAssets;
    removeAssets = mockRemoveAssets;
  }
  return { CollectionEditorService: MockCollectionEditorService, CollectionEditorContextProps: {} };
});


describe('CollectionEditor - Event Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInitializeDependencies.mockResolvedValue(undefined);
    mockCreateConfig.mockResolvedValue({ 
      context: { identifier: 'do_123', mode: 'edit' }, 
      config: { showAddCollaborator: true }, 
      metadata: { identifier: 'do_123' } 
    });
    mockCreateElement.mockReturnValue(document.createElement('lib-editor'));
    mockLoadAssets.mockImplementation(() => undefined);
    mockRemoveAssets.mockImplementation(() => undefined);
  });

  it('calls onEditorEvent when editor event is triggered', async () => {
    const onEditorEvent = vi.fn();
    
    render(
      <CollectionEditor 
        identifier="do_123" 
        metadata={{ identifier: 'do_123' }} 
        contextProps={{ mode: 'edit' }}
        onEditorEvent={onEditorEvent}
      />
    );

    await waitFor(() => {
      expect(mockAttachEventListeners).toHaveBeenCalled();
    });

    const attachCall: any = mockAttachEventListeners.mock.calls[0];
    const editorEventHandler: any = attachCall[1];

    editorEventHandler({ type: 'editorEmitter', data: { action: 'save' } });

    expect(onEditorEvent).toHaveBeenCalledWith({ type: 'editorEmitter', data: { action: 'save' } });
  });

  it('calls onTelemetryEvent when telemetry event is triggered', async () => {
    const onTelemetryEvent = vi.fn();
    
    render(
      <CollectionEditor 
        identifier="do_123" 
        metadata={{ identifier: 'do_123' }} 
        contextProps={{ mode: 'edit' }}
        onTelemetryEvent={onTelemetryEvent}
      />
    );

    await waitFor(() => {
      expect(mockAttachEventListeners).toHaveBeenCalled();
    });

    const attachCall: any = mockAttachEventListeners.mock.calls[0];
    const telemetryEventHandler: any = attachCall[2];

    telemetryEventHandler({ eid: 'INTERACT' });

    expect(onTelemetryEvent).toHaveBeenCalledWith({ eid: 'INTERACT' });
  });

  it('handles multiple editor events', async () => {
    const onEditorEvent = vi.fn();
    
    render(
      <CollectionEditor 
        identifier="do_123" 
        metadata={{ identifier: 'do_123' }} 
        contextProps={{ mode: 'edit' }}
        onEditorEvent={onEditorEvent}
      />
    );

    await waitFor(() => {
      expect(mockAttachEventListeners).toHaveBeenCalled();
    });

    const attachCall: any = mockAttachEventListeners.mock.calls[0];
    const editorEventHandler: any = attachCall[1];

    editorEventHandler({ type: 'editorEmitter', data: { action: 'save' } });
    editorEventHandler({ type: 'editorEmitter', data: { action: 'close' } });

    expect(onEditorEvent).toHaveBeenCalledTimes(2);
  });

  it('handles events without handlers gracefully', async () => {
    render(
      <CollectionEditor 
        identifier="do_123" 
        metadata={{ identifier: 'do_123' }} 
        contextProps={{ mode: 'edit' }}
      />
    );

    await waitFor(() => {
      expect(mockAttachEventListeners).toHaveBeenCalled();
    });
    const attachCall: any = mockAttachEventListeners.mock.calls[0];
    const editorEventHandler = attachCall[1];
    expect(() => editorEventHandler({ type: 'editorEmitter', data: {} })).not.toThrow();
  });
});

describe('CollectionEditor - Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInitializeDependencies.mockResolvedValue(undefined);
    mockCreateConfig.mockResolvedValue({ 
      context: { identifier: 'do_123', mode: 'edit' }, 
      config: { showAddCollaborator: true }, 
      metadata: { identifier: 'do_123' } 
    });
    mockCreateElement.mockReturnValue(document.createElement('lib-editor'));
    mockLoadAssets.mockImplementation(() => undefined);
    mockRemoveAssets.mockImplementation(() => undefined);
  });

  it('re-initializes when identifier changes', async () => {
    const { rerender } = render(
      <CollectionEditor 
        identifier="do_123" 
        metadata={{ identifier: 'do_123' }} 
        contextProps={{ mode: 'edit' }}
      />
    );
    await waitFor(() => {
      expect(mockInitializeDependencies).toHaveBeenCalledTimes(1);
    });

    rerender(
      <CollectionEditor 
        identifier="do_456" 
        metadata={{ identifier: 'do_456' }} 
        contextProps={{ mode: 'edit' }}
      />
    );
    await waitFor(() => {
      expect(mockInitializeDependencies).toHaveBeenCalledTimes(2);
    });
  });

  it('re-initializes when metadata changes', async () => {
    const { rerender } = render(
      <CollectionEditor 
        identifier="do_123" 
        metadata={{ identifier: 'do_123', name: 'First' }} 
        contextProps={{ mode: 'edit' }}
      />
    );

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledTimes(1);
    });

    rerender(
      <CollectionEditor 
        identifier="do_123" 
        metadata={{ identifier: 'do_123', name: 'Second' }} 
        contextProps={{ mode: 'edit' }}
      />
    );

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledTimes(2);
    });
  });

  it('re-initializes when contextProps changes', async () => {
    const { rerender } = render(
      <CollectionEditor 
        identifier="do_123" 
        metadata={{ identifier: 'do_123' }} 
        contextProps={{ mode: 'edit' }}
      />
    );

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledTimes(1);
    });

    rerender(
      <CollectionEditor 
        identifier="do_123" 
        metadata={{ identifier: 'do_123' }} 
        contextProps={{ mode: 'preview' }}
      />
    );

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledTimes(2);
    });
  });

  it('prevents initialization after component unmount', async () => {
    mockInitializeDependencies.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(undefined), 100))
    );

    const { unmount } = render(
      <CollectionEditor 
        identifier="do_123" 
        metadata={{ identifier: 'do_123' }} 
        contextProps={{ mode: 'edit' }}
      />
    );
    unmount();
    await waitFor(() => {
      expect(mockInitializeDependencies).toHaveBeenCalled();
    });
    expect(mockCreateConfig).not.toHaveBeenCalled();
  });

  it('cleans up element on unmount after successful initialization', async () => {
    const element = document.createElement('lib-editor');
    const removeSpy = vi.spyOn(element, 'remove');
    mockCreateElement.mockReturnValue(element);

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
    expect(mockRemoveEventListeners).toHaveBeenCalledWith(element);
    expect(removeSpy).toHaveBeenCalled();
  });
});