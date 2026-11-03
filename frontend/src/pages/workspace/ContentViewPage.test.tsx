import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ContentViewPage from './ContentViewPage';

const mockNavigate = vi.fn();
const mockToast = vi.fn();

// Hoist useContentRead mock so it can be overridden per test
const { mockUseContentRead, mockUseQumlContent } = vi.hoisted(() => ({
  mockUseContentRead: vi.fn(),
  mockUseQumlContent: vi.fn(() => ({ data: null, isLoading: false, error: null })),
}));

vi.mock('@/hooks/useContentPlayer', () => ({
  useContentPlayer: () => ({
    handlePlayerEvent: vi.fn(),
    handleTelemetryEvent: vi.fn(),
  }),
}));

// Default mock: content with status 'Review' and valid dates
vi.mock('@/hooks/useContent', () => ({
  useContentRead: (...args: any[]) => mockUseContentRead(...args),
}));

vi.mock('@/hooks/useQumlContent', () => ({
  useQumlContent: (...args: any[]) => mockUseQumlContent(...(args as [])),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: { getUserId: () => 'test-user-id' },
}));

vi.mock('@/services/ContentService', () => ({
  ContentService: class {
    contentPublish = vi.fn().mockResolvedValue({});
    contentReject = vi.fn().mockResolvedValue({});
  },
}));

vi.mock('@/services/FormService', () => ({
  FormService: class {
    formRead = vi.fn().mockResolvedValue({
      data: {
        form: {
          data: {
            fields: [
              {
                title: 'Please confirm that ALL the following items are verified',
                contents: [
                  { name: 'Appropriateness', checkList: ['No Hate speech', 'No Discrimination'] },
                ],
                otherReason: 'Other Reason',
              },
            ],
          },
        },
      },
    });
  },
}));

vi.mock('@/components/home/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('@/components/home/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

vi.mock('@/components/common/PageLoader', () => ({
  default: ({ message }: { message: string }) => <div data-testid="loader">{message}</div>,
}));

vi.mock('@/components/players', () => ({
  ContentPlayer: () => <div data-testid="content-player">Content Player</div>,
}));

vi.mock('@/services/ReviewCommentService', () => ({
  default: {
    hasComments: vi.fn().mockResolvedValue(false),
    deleteComments: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/components/workspace/ReviewPageHeader', () => ({
  default: ({ onBack, onPublish, onRequestChanges, isReviewMode }: any) => (
    <div className="content-review-button-container">
      <button onClick={onBack} className="content-review-go-back">
        Back
      </button>
      {isReviewMode && (
        <div className="content-review-actions">
          <button className="content-review-btn-publish" onClick={onPublish}>
            Publish
          </button>
          <button className="content-review-btn-reject" onClick={onRequestChanges}>
            Request for Changes
          </button>
        </div>
      )}
    </div>
  ),
}));

vi.mock('@/components/workspace/ReviewPlayerSection', () => ({
  default: ({ playerMetadata }: any) => (
    <div data-testid="review-player-section" data-body={typeof playerMetadata?.body === 'string' ? playerMetadata.body : ''}>Player Section</div>
  ),
}));

vi.mock('@/components/workspace/ChecklistDialog', () => ({
  default: ({ isOpen, formFields }: any) =>
    isOpen ? (
      <div data-testid="checklist-dialog">
        {formFields[0]?.title && <div>{formFields[0].title}</div>}
      </div>
    ) : null,
}));

vi.mock('@/components/workspace/PublishWarningDialog', () => ({
  default: () => null,
}));

vi.mock('@/hooks/useTelemetry', () => ({
  useTelemetry: () => ({ audit: vi.fn(), log: vi.fn(), impression: vi.fn() }),
}));

vi.mock('@/hooks/useImpression', () => ({
  default: vi.fn(),
  useImpression: vi.fn(),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string, params?: Record<string, string>) => params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ contentId: 'test-content-id' }),
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('mode=review')],
  };
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <BrowserRouter>
        <ContentViewPage mode="review" />
      </BrowserRouter>
    </QueryClientProvider>
  );

// Default content response used by most tests
const defaultContentResponse = {
  data: {
    data: {
      content: {
        name: 'Test Content',
        description: 'Test Description',
        creator: 'Test Creator',
        lastUpdatedOn: '2024-01-01',
        createdOn: '2024-01-01',
        primaryCategory: 'Resource',
        mimeType: 'application/pdf',
        status: 'Review',
      },
    },
  },
  isLoading: false,
  error: null,
};

describe('ContentViewPage - Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContentRead.mockReturnValue(defaultContentResponse);
  });
  afterEach(() => cleanup());

  it('should arrange buttons horizontally with flexbox layout', () => {
    renderPage();

    const backButton = screen.getByRole('button', { name: /^Back$/i });
    const publishButton = screen.getByText(/Publish/i);
    const actionButtonsContainer = publishButton.closest('.content-review-actions');

    expect(backButton).toBeInTheDocument();
    expect(publishButton).toBeInTheDocument();
    expect(screen.getByText(/Request for Changes/i)).toBeInTheDocument();
    expect(actionButtonsContainer).toBeInTheDocument();

    const parentContainer = backButton.closest('button')?.parentElement;
    expect(parentContainer).toHaveClass('content-review-button-container');

    const children = Array.from(parentContainer!.children);
    expect(children).toContain(backButton.closest('button'));
    expect(children).toContain(actionButtonsContainer);
    expect(children.length).toBe(2);
  });
});

describe('ContentViewPage - transcript enrichment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContentRead.mockReturnValue(defaultContentResponse);
  });
  afterEach(() => cleanup());

  it('requests enrichTranscripts so video captions load in the workspace view/review pages', () => {
    renderPage();
    expect(mockUseContentRead).toHaveBeenCalledWith('test-content-id', { mode: 'edit', enrichTranscripts: true });
  });
});

describe('ContentReviewPage - Button Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContentRead.mockReturnValue(defaultContentResponse);
    mockNavigate.mockClear();
    mockToast.mockClear();
  });
  afterEach(() => cleanup());

  it('should navigate to /workspace when Back button is clicked', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /^Back$/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/workspace');
  });

  it('should have Publish button present, enabled, and clickable', () => {
    renderPage();
    const publishButton = screen.getByRole('button', { name: /^Publish$/i });
    expect(publishButton).not.toBeDisabled();
    expect(publishButton).toHaveClass('content-review-btn-publish');
    expect(() => fireEvent.click(publishButton)).not.toThrow();
  });

  it('should open reject dialog when Request for Changes is clicked', async () => {
    renderPage();
    const rejectButton = screen.getByRole('button', { name: /Request for Changes/i });
    expect(rejectButton).not.toBeDisabled();
    expect(screen.queryByText(/Please confirm that ALL/i)).not.toBeInTheDocument();

    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(screen.getByText(/Please confirm that ALL/i)).toBeInTheDocument();
    });
  });

  it('should have proper CSS classes on all buttons', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /^Back$/i })).toHaveClass('content-review-go-back');
    expect(screen.getByRole('button', { name: /^Publish$/i })).toHaveClass('content-review-btn-publish');
    const rejectButton = screen.getByRole('button', { name: /Request for Changes/i });
    expect(rejectButton).toHaveClass('content-review-btn-reject');
    expect(rejectButton.closest('.content-review-actions')).toBeInTheDocument();
  });

  it('should render all buttons at different viewport sizes', () => {
    [375, 768, 1024, 1440].forEach((width) => {
      globalThis.innerWidth = width;
      window.dispatchEvent(new Event('resize'));

      const { unmount } = renderPage();

      expect(screen.getByRole('button', { name: /^Back$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Publish$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Request for Changes/i })).toBeInTheDocument();

      unmount();
    });
  });
});

describe('ContentViewPage - Publish and Reject flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContentRead.mockReturnValue(defaultContentResponse);
  });
  afterEach(() => cleanup());

  it('renders formatted dates correctly instead of fallback text', () => {
    renderPage();
    // The mocked data provides '2024-01-01' which formats to 'January 1, 2024'
    expect(screen.getAllByText('January 1, 2024').length).toBeGreaterThan(0);
  });

  it('clicking Publish triggers form load and shows checklist dialog', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /^Publish$/i }));
    await waitFor(() => {
      expect(screen.getByText(/Please confirm that ALL/i)).toBeInTheDocument();
    });
  });

  it('clicking Request for Changes triggers form load and shows checklist dialog', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Request for Changes/i }));
    await waitFor(() => {
      expect(screen.getByText(/Please confirm that ALL/i)).toBeInTheDocument();
    });
  });
});

// --- New tests for previously uncovered lines ---

describe('ContentViewPage - formatDate null path and navigation guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContentRead.mockReturnValue(defaultContentResponse);
  });
  afterEach(() => cleanup());

  it('shows notAvailable fallback when content has no dates (covers formatDate returning null, line 229)', () => {
    // Override useContentRead to return content with null/undefined date fields
    mockUseContentRead.mockReturnValue({
      data: {
        data: {
          content: {
            name: 'No-Date Content',
            description: 'Desc',
            creator: 'Author',
            lastUpdatedOn: undefined,
            createdOn: undefined,
            primaryCategory: 'Resource',
            mimeType: 'application/pdf',
            status: 'Review',
          },
        },
      },
      isLoading: false,
      error: null,
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <BrowserRouter>
          <ContentViewPage mode="review" />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Both date fields should fall back to the i18n key for 'not available'
    const notAvailableElements = screen.getAllByText('workspace.review.notAvailable');
    expect(notAvailableElements.length).toBeGreaterThanOrEqual(2);
  });

  it('navigates to /workspace with replace:true when in review mode and status is not Review (covers lines 166-167)', () => {
    // Override useContentRead to return a content with status 'Draft' (not 'Review')
    mockUseContentRead.mockReturnValue({
      data: {
        data: {
          content: {
            name: 'Draft Content',
            description: 'Desc',
            creator: 'Author',
            lastUpdatedOn: '2024-01-01',
            createdOn: '2024-01-01',
            primaryCategory: 'Resource',
            mimeType: 'application/pdf',
            status: 'Draft',
          },
        },
      },
      isLoading: false,
      error: null,
    });

    mockNavigate.mockClear();

    render(
      <QueryClientProvider client={new QueryClient()}>
        <BrowserRouter>
          {/* mode="review" triggers the isReviewMode === true path */}
          <ContentViewPage mode="review" />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // The component should call navigate('/workspace', { replace: true }) and return null
    expect(mockNavigate).toHaveBeenCalledWith('/workspace', { replace: true });
  });
});

describe('ContentViewPage - Dynamic Assess full pool by mode', () => {
  const levels: Record<string, string> = { a1: 'EASY', a2: 'EASY', a3: 'EASY', a4: 'EASY', b1: 'MEDIUM', b2: 'MEDIUM', b3: 'MEDIUM', b4: 'MEDIUM' };
  const body = JSON.stringify({
    theme: { stage: [{ 'org.ekstep.questionset': [{
      config: { __cdata: JSON.stringify({ dynamic_assess: { target: { E: 1, M: 1, D: 0 }, levels } }) },
      data: { __cdata: JSON.stringify(Object.keys(levels).map((identifier) => ({ identifier }))) },
      'org.ekstep.question': Object.keys(levels).map((id) => ({ id })),
    }] }] },
  });
  const renderMode = (mode: 'view' | 'review') => render(
    <QueryClientProvider client={new QueryClient()}>
      <BrowserRouter><ContentViewPage mode={mode} /></BrowserRouter>
    </QueryClientProvider>,
  );
  const playedQuestions = () => {
    const played = screen.getByTestId('review-player-section').getAttribute('data-body') || '{}';
    return JSON.parse(played).theme.stage[0]['org.ekstep.questionset'][0]['org.ekstep.question'].length;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContentRead.mockReturnValue({
      data: { data: { content: { ...defaultContentResponse.data.data.content, mimeType: 'application/vnd.ekstep.ecml-archive', primaryCategory: 'Dynamic Course Assessment', body } } },
      isLoading: false,
      error: null,
    });
  });
  afterEach(() => cleanup());

  it('plays the whole pool, not a learner draw, for a reviewer (positive)', () => {
    renderMode('review');
    expect(playedQuestions()).toBe(8);
  });

  it('plays the whole pool for the creator in view mode (positive)', () => {
    renderMode('view');
    expect(playedQuestions()).toBe(8);
  });

  it('asks useQumlContent for the full pool in both modes (positive)', () => {
    renderMode('review');
    renderMode('view');
    for (const call of mockUseQumlContent.mock.calls as unknown as [string, { fullPool?: boolean }][]) expect(call[1]?.fullPool).toBe(true);
    expect(mockUseQumlContent).toHaveBeenCalled();
  });

  it('still shows the not-ready error, not a blank player, for Dynamic ECML with nothing generated (negative)', () => {
    mockUseContentRead.mockReturnValue({
      data: { data: { content: { ...defaultContentResponse.data.data.content, mimeType: 'application/vnd.ekstep.ecml-archive', primaryCategory: 'Dynamic Course Assessment', body: undefined } } },
      isLoading: false,
      error: null,
    });
    renderMode('view');
    expect(screen.queryByTestId('review-player-section')).not.toBeInTheDocument();
  });
});
