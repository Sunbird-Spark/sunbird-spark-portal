import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CollectionEditorPage from './CollectionEditorPage';

const { mockNavigate, mockParams, mockContentRead, mockToast, mockRetireLock } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockParams: { contentId: 'do_123' as string | undefined },
  mockContentRead: vi.fn(),
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

vi.mock('@/services/ContentService', () => ({
  ContentService: class MockContentService {
    contentRead = mockContentRead;
  },
}));

vi.mock('@/hooks/useToast', () => ({
  toast: mockToast,
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
  useEditorLock: () => ({
    editorMode: 'edit',
    isEditMode: true,
    lockError: null,
    isLocking: false,
    retireLock: mockRetireLock,
  }),
}));

vi.mock('@/components/common/PageLoader', () => ({
  default: ({ message }: { message: string }) => <div data-testid="page-loader">{message}</div>,
}));

vi.mock('@/components/editors/CollectionEditor', () => ({
  default: ({
    identifier,
    contextProps,
    onEditorEvent,
  }: {
    identifier: string;
    contextProps: { mode: string };
    onEditorEvent?: (event: { data?: { close?: boolean } }) => void;
  }) => (
    <div data-testid="collection-editor">
      <span data-testid="identifier">{identifier}</span>
      <span data-testid="editor-mode">{contextProps.mode}</span>
      <button type="button" onClick={() => onEditorEvent?.({ data: { close: true } })}>
        Close editor
      </button>
    </div>
  ),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('CollectionEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.contentId = 'do_123';
    mockContentRead.mockResolvedValue({
      data: {
        content: {
          identifier: 'do_123',
          status: 'Draft',
          primaryCategory: 'Course',
        },
      },
    });
  });

  it('shows a loader while metadata is loading', () => {
    mockContentRead.mockImplementation(
      () => new Promise(() => undefined) as ReturnType<typeof mockContentRead>
    );

    renderWithRouter(<CollectionEditorPage />);
    expect(screen.getByTestId('page-loader')).toHaveTextContent('Loading editor...');
  });

  it('renders collection editor in read mode for FlagReview status', async () => {
    mockContentRead.mockResolvedValue({
      data: {
        content: {
          identifier: 'do_123',
          status: 'FlagReview',
          primaryCategory: 'Course',
        },
      },
    });

    renderWithRouter(<CollectionEditorPage />);

    await waitFor(() => {
      expect(screen.getByTestId('collection-editor')).toBeInTheDocument();
    });

    expect(mockContentRead).toHaveBeenCalledWith('do_123', expect.any(Array), 'edit');
    expect(screen.getByTestId('identifier')).toHaveTextContent('do_123');
    expect(screen.getByTestId('editor-mode')).toHaveTextContent('read');
  });

  it('maps Review status to review mode', async () => {
    mockContentRead.mockResolvedValue({
      data: {
        content: {
          identifier: 'do_123',
          status: 'Review',
          primaryCategory: 'Course',
        },
      },
    });

    renderWithRouter(<CollectionEditorPage />);

    await waitFor(() => {
      expect(screen.getByTestId('editor-mode')).toHaveTextContent('review');
    });
  });

  it('shows error toast and fallback when metadata fetch fails', async () => {
    mockContentRead.mockRejectedValue(new Error('failed'));

    renderWithRouter(<CollectionEditorPage />);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          description: 'Failed to load content metadata.',
          variant: 'destructive',
        })
      );
    });

    expect(screen.getByText('Failed to load content metadata.')).toBeInTheDocument();
    expect(screen.queryByTestId('collection-editor')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to workspace' })).toBeInTheDocument();
  });

  it('shows missing identifier fallback when contentId is absent', async () => {
    mockParams.contentId = undefined;

    renderWithRouter(<CollectionEditorPage />);

    await waitFor(() => {
      expect(screen.getByText('Missing content identifier.')).toBeInTheDocument();
    });

    expect(mockContentRead).not.toHaveBeenCalled();
    expect(screen.queryByTestId('collection-editor')).not.toBeInTheDocument();
  });

  it('navigates back to workspace when editor emits close event', async () => {
    renderWithRouter(<CollectionEditorPage />);

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
