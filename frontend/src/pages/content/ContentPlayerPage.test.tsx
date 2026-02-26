import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContentPlayerPage from './ContentPlayerPage';

// ── Hoisted mocks (available inside vi.mock factories) ─────────────────────

const { mockNavigate, mockParams } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockParams: { contentId: 'do_123' as string | undefined },
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

vi.mock('@/hooks/useContentPlayer', () => ({
  useContentPlayer: () => ({ handlePlayerEvent: vi.fn(), handleTelemetryEvent: vi.fn() }),
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

// ── Test suite ─────────────────────────────────────────────────────────────

describe('ContentPlayerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams.contentId = 'do_123';
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

  // ── Go Back ──────────────────────────────────────────────────────────────

  it('navigates back when Go Back is clicked', () => {
    makeContentRead(videoContent);
    render(<ContentPlayerPage />);
    fireEvent.click(screen.getByRole('button', { name: /Go Back/ }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
