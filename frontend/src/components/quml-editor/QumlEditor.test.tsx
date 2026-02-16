import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import QumlEditor from './QumlEditor';
import { qumlEditorService } from '../../services/editors/quml-editor/QumlEditorService';

vi.mock('jquery', () => ({
  default: () => ({
    fn: {
      fancytree: vi.fn(),
    },
  }),
}));

vi.mock('jquery.fancytree', () => ({}));
vi.mock('jquery.fancytree/dist/modules/jquery.fancytree.glyph.js', () => ({}));
vi.mock('jquery.fancytree/dist/modules/jquery.fancytree.dnd5.js', () => ({}));
vi.mock('reflect-metadata', () => ({}));

vi.mock('../../services/QumlEditorService', async () => {
  const actual = await vi.importActual<typeof import('../../services/editors/quml-editor/QumlEditorService')>('../../services/QumlEditorService');

  return {
    __esModule: true,
    ...actual,
    qumlEditorService: {
      createConfig: vi.fn(),
      createElement: vi.fn(),
      attachEventListeners: vi.fn(),
      removeEventListeners: vi.fn(),
    },
  };
});

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
    config: {},
  } as any;

  let mockElement: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).Reflect = { getMetadata: vi.fn() };
    mockElement = document.createElement('lib-questionset-editor');

    vi.mocked(qumlEditorService.createConfig).mockResolvedValue(mockConfig);
    vi.mocked(qumlEditorService.createElement).mockReturnValue(mockElement);
    vi.mocked(qumlEditorService.attachEventListeners).mockImplementation(() => {});
    vi.mocked(qumlEditorService.removeEventListeners).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses provided metadata to build config', async () => {
    render(
      <QumlEditor
        metadata={mockMetadata}
        mode="review"
        contextOverrides={{ uid: 'override-uid' } as any}
      />, { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(qumlEditorService.createConfig).toHaveBeenCalledWith(
        mockMetadata,
        expect.objectContaining({
          mode: 'review',
          contextOverrides: expect.objectContaining({ uid: 'override-uid' }),
        })
      );
      expect(qumlEditorService.createElement).toHaveBeenCalledWith(mockConfig);
    });
  });

  it('forwards editor events to consumer', async () => {
    const onEditorEvent = vi.fn();
    let capturedEditorHandler: ((event: any) => void) | undefined;

    vi.mocked(qumlEditorService.attachEventListeners).mockImplementation((_, editorHandler) => {
      capturedEditorHandler = editorHandler;
    });

    render(<QumlEditor metadata={mockMetadata} onEditorEvent={onEditorEvent} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(qumlEditorService.attachEventListeners).toHaveBeenCalled();
      expect(capturedEditorHandler).toBeDefined();
    });

    capturedEditorHandler?.({ type: 'submitContent', data: { id: 'x' }, editorId: 'do_123', timestamp: Date.now() });

    expect(onEditorEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'submitContent' }));
  });

  it('cleans up listeners on unmount', async () => {
    const { unmount } = render(<QumlEditor metadata={mockMetadata} />, { wrapper: createWrapper() });

    await waitFor(() => expect(qumlEditorService.createElement).toHaveBeenCalled());

    unmount();

    expect(qumlEditorService.removeEventListeners).toHaveBeenCalledWith(mockElement);
  });
});
