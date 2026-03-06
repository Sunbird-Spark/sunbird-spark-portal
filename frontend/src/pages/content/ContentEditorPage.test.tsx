import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ContentEditorPage from './ContentEditorPage';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
const { mockNavigate, mockParams, mockRetireLock } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockParams: { contentId: 'do_789' as string | undefined },
  mockRetireLock: vi.fn().mockResolvedValue(undefined),
}));

// ── react-router-dom ──────────────────────────────────────────────────────────
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

// ── Telemetry (suppress "must be used within TelemetryProvider" warnings) ─────
vi.mock('@/hooks/useTelemetry', () => ({
  useTelemetry: () => ({
    start: vi.fn(),
    end: vi.fn(),
    impression: vi.fn(),
    interact: vi.fn(),
    audit: vi.fn(),
    error: vi.fn(),
    share: vi.fn(),
    log: vi.fn(),
    exData: vi.fn(),
    feedback: vi.fn(),
    isInitialized: true,
  }),
}));

// ── Data / hooks ──────────────────────────────────────────────────────────────
const mockUseContentRead = vi.fn();
const mockUseEditorLock = vi.fn();

vi.mock('@/hooks/useContent', () => ({
  useContentRead: (id: string) => mockUseContentRead(id),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('@/hooks/useEditorLock', () => ({
  useEditorLock: (opts: any) => mockUseEditorLock(opts),
}));

// ── UI components ─────────────────────────────────────────────────────────────
vi.mock('@/components/common/PageLoader', () => ({
  default: ({ message }: { message: string }) => (
    <div data-testid="page-loader">{message}</div>
  ),
}));

vi.mock('@/components/editors/EditorErrorState', () => ({
  default: ({ message, showRetry }: { message: string; showRetry?: boolean }) => (
    <div data-testid="editor-error">
      <span>{message}</span>
      {showRetry && <button>retry</button>}
    </div>
  ),
}));

vi.mock('@/components/editors/ContentEditor', () => ({
  ContentEditor: ({
    metadata,
    onClose,
  }: {
    metadata: any;
    onClose?: () => void;
    onEditorEvent?: (event: any) => void;
  }) => (
    <div data-testid="content-editor">
      <span data-testid="identifier">{metadata?.identifier}</span>
      <button type="button" onClick={onClose}>Close editor</button>
    </div>
  ),
}));

// ── Helper ────────────────────────────────────────────────────────────────────
const renderPage = () =>
  render(<MemoryRouter><ContentEditorPage /></MemoryRouter>);

const draftContent = {
  identifier: 'do_789',
  name: 'Test Resource',
  status: 'Draft',
};

describe('ContentEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.contentId = 'do_789';
    mockUseContentRead.mockReturnValue({
      data: { data: { content: draftContent } },
      isLoading: false,
      error: null,
    });
    mockUseEditorLock.mockReturnValue({
      lockError: null,
      isLocking: false,
      retireLock: mockRetireLock,
    });
  });

  // ── Loading / lock states ─────────────────────────────────────────────────

  it('shows loader while content is loading', () => {
    mockUseContentRead.mockReturnValue({ data: null, isLoading: true, error: null });
    renderPage();
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    expect(screen.getByTestId('page-loader')).toHaveTextContent('Loading editor...');
  });

  // ── Error states ──────────────────────────────────────────────────────────

  it('shows error state when content fetch fails', () => {
    mockUseContentRead.mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: 'Network error' },
    });
    renderPage();

    expect(screen.getByTestId('editor-error')).toBeInTheDocument();
    expect(screen.getByText('Error loading content: Network error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'retry' })).toBeInTheDocument();
  });

  it('shows not-found state when content is null', () => {
    mockUseContentRead.mockReturnValue({
      data: { data: { content: null } },
      isLoading: false,
      error: null,
    });
    renderPage();

    expect(screen.getByTestId('editor-error')).toBeInTheDocument();
    expect(screen.getByText('Content not found')).toBeInTheDocument();
  });

  it('shows error state when contentId is absent', () => {
    mockParams.contentId = undefined;
    mockUseContentRead.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    renderPage();

    expect(screen.getByTestId('editor-error')).toBeInTheDocument();
  });

  // ── Successful render ─────────────────────────────────────────────────────

  it('renders the content editor with correct identifier', () => {
    renderPage();

    expect(screen.getByTestId('content-editor')).toBeInTheDocument();
    expect(screen.getByTestId('identifier')).toHaveTextContent('do_789');
  });

  it('calls useContentRead with the contentId from params', () => {
    renderPage();
    expect(mockUseContentRead).toHaveBeenCalledWith('do_789');
  });

  // ── Close / navigate ──────────────────────────────────────────────────────

  it('navigates to /workspace and retires lock when editor is closed', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Close editor' }));

    await waitFor(() => {
      expect(mockRetireLock).toHaveBeenCalled();
    });
    expect(mockNavigate).toHaveBeenCalledWith('/workspace');
  });

  // ── Lock states ───────────────────────────────────────────────────────────

  it('shows loader while acquiring the content lock', () => {
    mockUseEditorLock.mockReturnValue({
      lockError: null,
      isLocking: true,
      retireLock: mockRetireLock,
    });
    renderPage();

    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    expect(screen.getByTestId('page-loader')).toHaveTextContent('Acquiring content lock...');
  });

  it('shows editor error when lock acquisition fails', () => {
    mockUseEditorLock.mockReturnValue({
      lockError: 'Content is locked by another user',
      isLocking: false,
      retireLock: mockRetireLock,
    });
    renderPage();

    expect(screen.getByTestId('editor-error')).toBeInTheDocument();
    expect(screen.getByText('Content is locked by another user')).toBeInTheDocument();
  });
});
