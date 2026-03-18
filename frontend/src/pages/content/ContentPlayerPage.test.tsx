import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ContentPlayerPage from './ContentPlayerPage';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────
const { mockNavigate, mockParams, mockTelemetryAudit } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockParams: { contentId: 'do_player_001' as string | undefined },
  mockTelemetryAudit: vi.fn(),
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

// ── Telemetry ─────────────────────────────────────────────────────────────────
vi.mock('@/hooks/useTelemetry', () => ({
  useTelemetry: () => ({
    start: vi.fn(),
    end: vi.fn(),
    impression: vi.fn(),
    interact: vi.fn(),
    audit: mockTelemetryAudit,
    error: vi.fn(),
    share: vi.fn(),
    log: vi.fn(),
    exData: vi.fn(),
    feedback: vi.fn(),
    isInitialized: true,
  }),
}));

// ── Data hooks ────────────────────────────────────────────────────────────────
const mockUseContentRead = vi.fn();
const mockUseContentSearch = vi.fn();
const mockUseQumlContent = vi.fn();

vi.mock('@/hooks/useContent', () => ({
  useContentRead: (id: string) => mockUseContentRead(id),
  useContentSearch: (opts: any) => mockUseContentSearch(opts),
}));

vi.mock('@/hooks/useQumlContent', () => ({
  useQumlContent: (id: string, opts: any) => mockUseQumlContent(id, opts),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

// ── Capture the telemetry callback from useContentPlayer ─────────────────────
let capturedOnTelemetryEvent: ((event: any) => void) | undefined;

vi.mock('@/hooks/useContentPlayer', () => ({
  useContentPlayer: ({ onTelemetryEvent }: { onTelemetryEvent?: (event: any) => void }) => {
    capturedOnTelemetryEvent = onTelemetryEvent;
    return { handlePlayerEvent: vi.fn(), handleTelemetryEvent: vi.fn() };
  },
}));

vi.mock('@/services/collection', () => ({
  mapSearchContentToRelatedContentItems: () => [],
}));

// ── UI components ─────────────────────────────────────────────────────────────
vi.mock('@/components/home/Header', () => ({
  default: () => <div data-testid="app-header" />,
}));
vi.mock('@/components/home/Footer', () => ({
  default: () => <div data-testid="app-footer" />,
}));
vi.mock('@/components/common/PageLoader', () => ({
  default: ({ message }: { message: string }) => (
    <div data-testid="page-loader">{message}</div>
  ),
}));
vi.mock('@/components/common/RelatedContent', () => ({
  default: () => <div data-testid="related-content" />,
}));
vi.mock('@/components/players', () => ({
  ContentPlayer: ({ mimeType }: { mimeType: string; metadata?: any; onPlayerEvent?: any; onTelemetryEvent?: any }) => (
    <div data-testid="content-player">
      <span data-testid="mime-type">{mimeType}</span>
    </div>
  ),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
const regularContent = {
  identifier: 'do_player_001',
  name: 'Test Video',
  mimeType: 'video/mp4',
};

const renderPage = () => render(<MemoryRouter><ContentPlayerPage /></MemoryRouter>);

describe('ContentPlayerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnTelemetryEvent = undefined;
    mockParams.contentId = 'do_player_001';

    mockUseContentRead.mockReturnValue({
      data: { data: { content: regularContent } },
      isLoading: false,
      error: null,
    });
    mockUseQumlContent.mockReturnValue({ data: null, isLoading: false, error: null });
    mockUseContentSearch.mockReturnValue({ data: null });
  });

  // ── Loading / error states ────────────────────────────────────────────────

  it('shows loader while content is loading', () => {
    mockUseContentRead.mockReturnValue({ data: null, isLoading: true, error: null });
    renderPage();
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  it('shows error message when content fetch fails', () => {
    mockUseContentRead.mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: 'Network error' },
    });
    renderPage();
    expect(screen.getByText('content.errorLoading')).toBeInTheDocument();
  });

  it('shows not-found message when content is absent', () => {
    mockUseContentRead.mockReturnValue({
      data: { data: { content: null } },
      isLoading: false,
      error: null,
    });
    renderPage();
    expect(screen.getByText('content.notFound')).toBeInTheDocument();
  });

  // ── Successful render ─────────────────────────────────────────────────────

  it('renders header and footer', () => {
    renderPage();
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByTestId('app-footer')).toBeInTheDocument();
  });

  it('renders the content player with the correct mimeType', () => {
    renderPage();
    expect(screen.getByTestId('content-player')).toBeInTheDocument();
    expect(screen.getByTestId('mime-type')).toHaveTextContent('video/mp4');
  });

  it('renders related content section', () => {
    renderPage();
    expect(screen.getByTestId('related-content')).toBeInTheDocument();
  });

  // ── QUML content ──────────────────────────────────────────────────────────

  it('uses QUML data for questionset mimeType', () => {
    const qumlContent = {
      identifier: 'do_player_001',
      name: 'Test QuestionSet',
      mimeType: 'application/vnd.sunbird.questionset',
    };
    mockUseContentRead.mockReturnValue({
      data: { data: { content: qumlContent } },
      isLoading: false,
      error: null,
    });
    mockUseQumlContent.mockReturnValue({ data: qumlContent, isLoading: false, error: null });

    renderPage();
    expect(screen.getByTestId('content-player')).toBeInTheDocument();
    expect(screen.getByTestId('mime-type')).toHaveTextContent('application/vnd.sunbird.questionset');
  });

  it('shows loader when QUML data is loading', () => {
    mockUseContentRead.mockReturnValue({
      data: {
        data: {
          content: {
            identifier: 'do_player_001',
            name: 'Test QuestionSet',
            mimeType: 'application/vnd.sunbird.questionset',
          },
        },
      },
      isLoading: false,
      error: null,
    });
    mockUseQumlContent.mockReturnValue({ data: null, isLoading: true, error: null });

    renderPage();
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
  });

  // ── Telemetry: ASSESS audit ───────────────────────────────────────────────

  it('fires audit telemetry with Passed state on ASSESS pass', () => {
    renderPage();

    capturedOnTelemetryEvent?.({ eid: 'ASSESS', edata: { pass: 'Yes' } });

    expect(mockTelemetryAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        edata: expect.objectContaining({
          props: ['score'],
          state: 'Passed',
        }),
        object: { id: 'do_player_001', type: 'Content' },
      })
    );
  });

  it('fires audit telemetry with Failed state when pass is falsy', () => {
    renderPage();

    // pass: false (falsy) → state: 'Failed'
    capturedOnTelemetryEvent?.({ eid: 'ASSESS', edata: { pass: false } });

    expect(mockTelemetryAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        edata: expect.objectContaining({ state: 'Failed' }),
      })
    );
  });

  it('does not fire audit for non-ASSESS events', () => {
    renderPage();

    capturedOnTelemetryEvent?.({ eid: 'INTERACT', edata: {} });

    expect(mockTelemetryAudit).not.toHaveBeenCalled();
  });
});
