import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import CollectionEditor from './CollectionEditor';

vi.mock('../../services/editors/collection-editor', () => {
  class MockCollectionEditorService {
    initializeDependencies = vi.fn().mockResolvedValue(undefined);
    createConfig = vi.fn().mockResolvedValue({ context: { identifier: 'do_123' }, config: {}, metadata: {} });
    createElement = vi.fn().mockReturnValue(document.createElement('lib-editor'));
    attachEventListeners = vi.fn();
    removeEventListeners = vi.fn();
  }

  return {
    CollectionEditorService: MockCollectionEditorService,
    CollectionEditorContextProps: {},
  };
});

describe('CollectionEditor component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes editor with identifier', async () => {
    const { container } = render(
      <CollectionEditor 
        identifier="do_123" 
        metadata={{ identifier: 'do_123' }} 
        contextProps={{ mode: 'edit' }}
      />
    );

    await waitFor(() => {
      const host = container.querySelector('#collection-editor-container');
      expect(host).toBeTruthy();
    });
  });
});
