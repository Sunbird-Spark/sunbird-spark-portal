import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QumlEditorPage from './QumlEditorPage';

const { mockNavigate, mockParams, mockGetQuestionset, mockToast, mockRetireLock } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockParams: { contentId: 'do_456' as string | undefined },
  mockGetQuestionset: vi.fn(),
  mockToast: vi.fn(),
  mockRetireLock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

vi.mock('@/services/QuestionSetService', () => ({
  QuestionSetService: class MockQuestionSetService {
    getQuestionset = mockGetQuestionset;
  },
}));

vi.mock('@/hooks/useToast', () => ({
  toast: mockToast,
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('@/hooks/useUserRead', () => ({
  useUserRead: () => ({
    data: {
      data: {
        response: {
          roles: [{ role: 'CONTENT_REVIEWER' }],
        },
      },
    },
  }),
}));

vi.mock('@/hooks/useEditorLock', () => ({
  useEditorLock: ({ metadata }: { metadata: any }) => {
    const status = metadata?.status;
    let editorMode: 'edit' | 'read' | 'review' = 'edit';
    
    if (status === 'FlagReview' || status === 'FlagDraft' || status === 'Processing') {
      editorMode = 'read';
    } else if (status === 'Review') {
      editorMode = 'review';
    }
    
    return {
      editorMode,
      isEditMode: editorMode === 'edit',
      lockError: null,
      isLocking: false,
      retireLock: mockRetireLock,
    };
  },
}));

vi.mock('@/components/common/PageLoader', () => ({
  default: ({ message }: { message: string }) => <div data-testid="page-loader">{message}</div>,
}));

vi.mock('@/components/quml-editor/QumlEditor', () => ({
  default: ({
    metadata,
    mode,
    onEditorEvent,
  }: {
    metadata: any;
    mode: string;
    contextOverrides?: any;
    onEditorEvent?: (event: { data?: { close?: boolean } }) => void;
    onTelemetryEvent?: (event: any) => void;
  }) => (
    <div data-testid="quml-editor">
      <span data-testid="identifier">{metadata?.identifier}</span>
      <span data-testid="editor-mode">{mode}</span>
      <button type="button" onClick={() => onEditorEvent?.({ data: { close: true } })}>
        Close editor
      </button>
    </div>
  ),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('QumlEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.contentId = 'do_456';
    mockGetQuestionset.mockResolvedValue({
      questionset: {
        identifier: 'do_456',
        status: 'Draft',
        primaryCategory: 'Practice Question Set',
      },
    });
  });

  it('shows a loader while metadata is loading', () => {
    mockGetQuestionset.mockImplementation(
      () => new Promise(() => undefined) as ReturnType<typeof mockGetQuestionset>
    );

    renderWithRouter(<QumlEditorPage />);
    expect(screen.getByTestId('page-loader')).toHaveTextContent('content.loadingEditor');
  });

  it('renders quml editor in edit mode for Draft status', async () => {
    renderWithRouter(<QumlEditorPage />);

    await waitFor(() => {
      expect(screen.getByTestId('quml-editor')).toBeInTheDocument();
    });

    expect(mockGetQuestionset).toHaveBeenCalledWith('do_456');
    expect(screen.getByTestId('identifier')).toHaveTextContent('do_456');
    expect(screen.getByTestId('editor-mode')).toHaveTextContent('edit');
  });

  it('renders quml editor in read mode for FlagReview status', async () => {
    mockGetQuestionset.mockResolvedValue({
      questionset: {
        identifier: 'do_456',
        status: 'FlagReview',
        primaryCategory: 'Practice Question Set',
      },
    });

    renderWithRouter(<QumlEditorPage />);

    await waitFor(() => {
      expect(screen.getByTestId('quml-editor')).toBeInTheDocument();
    });

    expect(screen.getByTestId('editor-mode')).toHaveTextContent('read');
  });

  it('maps Review status to review mode', async () => {
    mockGetQuestionset.mockResolvedValue({
      questionset: {
        identifier: 'do_456',
        status: 'Review',
        primaryCategory: 'Practice Question Set',
      },
    });

    renderWithRouter(<QumlEditorPage />);

    await waitFor(() => {
      expect(screen.getByTestId('editor-mode')).toHaveTextContent('review');
    });
  });

  it('shows error toast and fallback when metadata fetch fails', async () => {
    mockGetQuestionset.mockRejectedValue(new Error('failed'));

    renderWithRouter(<QumlEditorPage />);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'Failed to load question set metadata.',
          variant: 'destructive',
        })
      );
    });

    expect(screen.getByText('Question set not found')).toBeInTheDocument();
    expect(screen.queryByTestId('quml-editor')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'retry' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'content.backToWorkspace' })).toBeInTheDocument();
  });

  it('shows fallback when contentId is absent', async () => {
    mockParams.contentId = undefined;

    renderWithRouter(<QumlEditorPage />);

    await waitFor(() => {
      expect(screen.queryByTestId('quml-editor')).not.toBeInTheDocument();
    });

    expect(mockGetQuestionset).not.toHaveBeenCalled();
  });

  it('navigates back to workspace when editor emits close event', async () => {
    renderWithRouter(<QumlEditorPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Close editor' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Close editor' }));
    
    await waitFor(() => {
      expect(mockRetireLock).toHaveBeenCalled();
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/workspace');
  });
});
