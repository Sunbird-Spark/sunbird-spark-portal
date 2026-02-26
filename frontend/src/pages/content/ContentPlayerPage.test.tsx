import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ContentPlayerPage from './ContentPlayerPage';

// ── Hoisted mocks (available inside vi.mock factories) ─────────────────────

const { mockNavigate, mockParams, capturedCallbacks } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockParams: { contentId: 'do_123' as string | undefined },
  capturedCallbacks: { onTelemetryEvent: undefined as ((e: unknown) => void) | undefined },
}));

// ── Module mocks ───────────────────────────────────────────────────────────

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => mockParams };
});

vi.mock('@/hooks/useContent', () => ({
  useContentRead: vi.fn(),
  useContentSearch: () => ({ data: undefined }),
}));

vi.mock('@/hooks/useQumlContent', () => ({
  useQumlContent: () => ({ data: undefined, isLoading: false, error: undefined }),
}));

// Capture onTelemetryEvent so tests can simulate player events
vi.mock('@/hooks/useContentPlayer', () => ({
  useContentPlayer: (opts: { onTelemetryEvent?: (e: unknown) => void }) => {
    capturedCallbacks.onTelemetryEvent = opts?.onTelemetryEvent;
    return { handlePlayerEvent: vi.fn(), handleTelemetryEvent: vi.fn() };
  },
}));

vi.mock('@/services/collection', () => ({
  mapSearchContentToRelatedContentItems: vi.fn(() => []),
}));

vi.mock('@/components/players', () => ({
  ContentPlayer: () => <div data-testid="content-player" />,
}));

vi.mock('@/components/common/PageLoader', () => ({
  default: ({ message }: { message: string }) => <div data-testid="page-loader">{message}</div>,
}));

vi.mock('@/components/common/RelatedContent', () => ({
  default: () => <div data-testid="related-content" />,
}));

vi.mock('@/components/common/RatingDialog', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="rating-dialog">
        <button onClick={onClose}>Close Rating</button>
      </div>
    ) : null,
}));

vi.mock('@/components/home/Header', () => ({ default: () => <div data-testid="header" /> }));
vi.mock('@/components/home/Footer', () => ({ default: () => <div data-testid="footer" /> }));

// ── Helpers ────────────────────────────────────────────────────────────────

import { useContentRead } from '@/hooks/useContent';

const makeContentRead = (content: object | null, isLoading = false, error?: Error) =>
  vi.mocked(useContentRead).mockReturnValue({
    data: content ? { data: { content } } : undefined,
    isLoading,
    error,
  } as any);

const videoContent = { identifier: 'do_123', name: 'Test Video', mimeType: 'video/mp4' };
const h5pContent = {
  identifier: 'do_h5p_1',
  name: 'Test H5P',
  mimeType: 'application/vnd.ekstep.h5p-archive',
};

// ── Test suite ─────────────────────────────────────────────────────────────

describe('ContentPlayerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.contentId = 'do_123';
    capturedCallbacks.onTelemetryEvent = undefined;
    vi.spyOn(window.history, 'go').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ── Loading / error states ───────────────────────────────────────────────

  it('shows page loader while content is loading', () => {
    makeContentRead(null, true);
    render(<ContentPlayerPage />);
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  it('shows error message when content fetch fails', () => {
    makeContentRead(null, false, new Error('Network error'));
    render(<ContentPlayerPage />);
    expect(screen.getByText(/Error loading content: Network error/)).toBeInTheDocument();
  });

  it('shows "Content not found" when metadata is absent', () => {
    makeContentRead(null);
    render(<ContentPlayerPage />);
    expect(screen.getByText('Content not found')).toBeInTheDocument();
  });

  // ── Rendered content ─────────────────────────────────────────────────────

  it('renders content title, player, and Go Back button', () => {
    makeContentRead(videoContent);
    render(<ContentPlayerPage />);
    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByTestId('content-player')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go Back/ })).toBeInTheDocument();
  });

  it('rating dialog is not visible on initial render', () => {
    makeContentRead(videoContent);
    render(<ContentPlayerPage />);
    expect(screen.queryByTestId('rating-dialog')).not.toBeInTheDocument();
  });

  // ── Go Back — regular content ────────────────────────────────────────────

  it('navigates back immediately when Go Back is clicked for non-H5P content', () => {
    makeContentRead(videoContent);
    render(<ContentPlayerPage />);
    fireEvent.click(screen.getByRole('button', { name: /Go Back/ }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
    expect(screen.queryByTestId('rating-dialog')).not.toBeInTheDocument();
  });

  // ── Go Back — H5P ────────────────────────────────────────────────────────

  it('shows rating dialog (does not navigate) when Go Back is clicked for H5P', () => {
    makeContentRead(h5pContent);
    render(<ContentPlayerPage />);
    fireEvent.click(screen.getByRole('button', { name: /Go Back/ }));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByTestId('rating-dialog')).toBeInTheDocument();
  });

  it('navigates back after closing the rating dialog for H5P Go Back', () => {
    makeContentRead(h5pContent);
    render(<ContentPlayerPage />);
    fireEvent.click(screen.getByRole('button', { name: /Go Back/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Close Rating' }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
    expect(screen.queryByTestId('rating-dialog')).not.toBeInTheDocument();
  });

  // ── END telemetry event → rating dialog ──────────────────────────────────

  it('shows rating dialog 5 seconds after END telemetry event', () => {
    vi.useFakeTimers();
    makeContentRead(videoContent);
    render(<ContentPlayerPage />);

    act(() => { capturedCallbacks.onTelemetryEvent?.({ eid: 'END' }); });
    expect(screen.queryByTestId('rating-dialog')).not.toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByTestId('rating-dialog')).toBeInTheDocument();
  });

  it('does not show rating dialog before the 5 second delay elapses', () => {
    vi.useFakeTimers();
    makeContentRead(videoContent);
    render(<ContentPlayerPage />);

    act(() => { capturedCallbacks.onTelemetryEvent?.({ eid: 'END' }); });
    act(() => { vi.advanceTimersByTime(4999); });
    expect(screen.queryByTestId('rating-dialog')).not.toBeInTheDocument();
  });

  it('does not navigate after closing rating dialog triggered by END event', () => {
    vi.useFakeTimers();
    makeContentRead(videoContent);
    render(<ContentPlayerPage />);

    act(() => { capturedCallbacks.onTelemetryEvent?.({ eid: 'END' }); });
    act(() => { vi.advanceTimersByTime(5000); });
    fireEvent.click(screen.getByRole('button', { name: 'Close Rating' }));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not show rating dialog for non-END telemetry events', () => {
    vi.useFakeTimers();
    makeContentRead(videoContent);
    render(<ContentPlayerPage />);

    act(() => { capturedCallbacks.onTelemetryEvent?.({ eid: 'START' }); });
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.queryByTestId('rating-dialog')).not.toBeInTheDocument();
  });

  // ── Browser back button (popstate) — H5P ─────────────────────────────────

  it('intercepts browser back for H5P: calls history.go(1) and shows rating dialog', () => {
    makeContentRead(h5pContent);
    render(<ContentPlayerPage />);

    act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });

    expect(window.history.go).toHaveBeenCalledWith(1);
    expect(screen.getByTestId('rating-dialog')).toBeInTheDocument();
  });

  it('navigates back after closing rating dialog triggered by browser back for H5P', () => {
    makeContentRead(h5pContent);
    render(<ContentPlayerPage />);

    act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });
    fireEvent.click(screen.getByRole('button', { name: 'Close Rating' }));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('the counteracting second popstate does not re-trigger the dialog or call history.go again', () => {
    makeContentRead(h5pContent);
    render(<ContentPlayerPage />);

    // First popstate: user presses back
    act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });
    expect(window.history.go).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('rating-dialog')).toBeInTheDocument();

    // Second popstate: the undo fired by history.go(1)
    act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });
    expect(window.history.go).toHaveBeenCalledTimes(1); // no additional call
  });

  it('does not intercept popstate for non-H5P content', () => {
    makeContentRead(videoContent);
    render(<ContentPlayerPage />);

    act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });

    expect(window.history.go).not.toHaveBeenCalled();
    expect(screen.queryByTestId('rating-dialog')).not.toBeInTheDocument();
  });

  it('does not intercept popstate after rating is already done for H5P', () => {
    makeContentRead(h5pContent);
    render(<ContentPlayerPage />);

    // Trigger and dismiss the dialog via Go Back
    fireEvent.click(screen.getByRole('button', { name: /Go Back/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Close Rating' }));
    mockNavigate.mockClear();
    vi.mocked(window.history.go).mockClear();

    // Subsequent popstate should not re-show dialog or call history.go
    act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });
    expect(window.history.go).not.toHaveBeenCalled();
    expect(screen.queryByTestId('rating-dialog')).not.toBeInTheDocument();
  });
});
