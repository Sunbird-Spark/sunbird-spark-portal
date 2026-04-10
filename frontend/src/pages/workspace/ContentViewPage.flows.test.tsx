import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ContentViewPage from './ContentViewPage';

const mockNavigate = vi.fn();
const mockToast = vi.fn();

const { mockUseContentRead } = vi.hoisted(() => ({ mockUseContentRead: vi.fn() }));

vi.mock('@/hooks/useContentPlayer', () => ({ useContentPlayer: () => ({ handlePlayerEvent: vi.fn(), handleTelemetryEvent: vi.fn() }) }));
vi.mock('@/hooks/useContent', () => ({ useContentRead: (...args: any[]) => mockUseContentRead(...args) }));
vi.mock('@/hooks/useQumlContent', () => ({ useQumlContent: () => ({ data: null, isLoading: false, error: null }) }));
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ toast: mockToast }) }));
vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({ default: { getUserId: () => 'uid' } }));
vi.mock('@/services/ContentService', () => ({ ContentService: class { contentPublish = vi.fn().mockResolvedValue({}); contentReject = vi.fn().mockResolvedValue({}); } }));
vi.mock('@/services/FormService', () => ({
  FormService: class {
    formRead = vi.fn().mockResolvedValue({ data: { form: { data: { fields: [{ title: 'Please confirm that ALL the following items are verified', contents: [], otherReason: '' }] } } } });
  },
}));
vi.mock('@/components/home/Header', () => ({ default: () => <div /> }));
vi.mock('@/components/home/Footer', () => ({ default: () => <div /> }));
vi.mock('@/components/common/PageLoader', () => ({ default: ({ message }: any) => <div data-testid="loader">{message}</div> }));
vi.mock('@/components/players', () => ({ ContentPlayer: () => <div /> }));
vi.mock('@/services/ReviewCommentService', () => ({ default: { hasComments: vi.fn().mockResolvedValue(false), deleteComments: vi.fn().mockResolvedValue({}) } }));
vi.mock('@/components/workspace/ReviewPlayerSection', () => ({ default: () => <div data-testid="player" /> }));
vi.mock('@/hooks/useTelemetry', () => ({ useTelemetry: () => ({ audit: vi.fn() }) }));
vi.mock('@/hooks/useImpression', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useAppI18n', () => ({ useAppI18n: () => ({ t: (k: string) => k }) }));

vi.mock('@/components/workspace/ReviewPageHeader', () => ({
  default: ({ onBack, onPublish, onRequestChanges, isReviewMode }: any) => (
    <div>
      <button onClick={onBack}>Back</button>
      {isReviewMode && <>
        <button className="content-review-btn-publish" onClick={onPublish}>Publish</button>
        <button onClick={onRequestChanges}>Request for Changes</button>
      </>}
    </div>
  ),
}));

vi.mock('@/components/workspace/ChecklistDialog', () => ({
  default: ({ isOpen, formFields, onPublish, onRequestChanges }: any) =>
    isOpen ? (
      <div data-testid="checklist-dialog">
        {formFields[0]?.title && <div>{formFields[0].title}</div>}
        {onPublish && <button data-testid="confirm-publish" onClick={() => onPublish()}>Confirm Publish</button>}
        {onRequestChanges && <button data-testid="confirm-reject" onClick={() => onRequestChanges([], '')}>Confirm Changes</button>}
      </div>
    ) : null,
}));

vi.mock('@/components/workspace/PublishWarningDialog', () => ({
  default: ({ isOpen, onConfirm, onClose }: any) =>
    isOpen ? (
      <div data-testid="publish-warning-dialog">
        <button data-testid="warning-confirm" onClick={onConfirm}>Proceed Anyway</button>
        <button data-testid="warning-close" onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: () => ({ contentId: 'test-id' }), useNavigate: () => mockNavigate };
});

const wrap = (node: React.ReactNode) => (
  <QueryClientProvider client={new QueryClient()}>
    <BrowserRouter>{node}</BrowserRouter>
  </QueryClientProvider>
);

const reviewContent = (overrides = {}) => ({
  data: { data: { content: { name: 'Test', status: 'Review', mimeType: 'application/pdf', versionKey: 'v1', ...overrides } } },
  isLoading: false,
  error: null,
});

describe('ContentViewPage - Loading / Error / NotFound states', () => {
  afterEach(() => cleanup());

  it('shows PageLoader when content is loading', () => {
    mockUseContentRead.mockReturnValue({ data: null, isLoading: true, error: null });
    render(wrap(<ContentViewPage mode="view" />));
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('shows error message when content load fails', () => {
    mockUseContentRead.mockReturnValue({ data: null, isLoading: false, error: new Error('Network error') });
    render(wrap(<ContentViewPage mode="view" />));
    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  it('shows content not found message when playerMetadata is null', () => {
    mockUseContentRead.mockReturnValue({ data: { data: { content: null } }, isLoading: false, error: null });
    render(wrap(<ContentViewPage mode="view" />));
    expect(screen.getByText('workspace.review.contentNotFound')).toBeInTheDocument();
  });
});

describe('ContentViewPage - view mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContentRead.mockReturnValue(reviewContent({ status: 'Live', description: 'Some description', primaryCategory: 'Resource' }));
  });
  afterEach(() => cleanup());

  it('renders without review-mode actions in view mode', () => {
    render(wrap(<ContentViewPage mode="view" />));
    expect(screen.queryByRole('button', { name: /Publish/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Request for Changes/i })).not.toBeInTheDocument();
  });

  it('shows content description when present', () => {
    render(wrap(<ContentViewPage mode="view" />));
    expect(screen.getByText('Some description')).toBeInTheDocument();
  });

  it('shows contentType fallback when no primaryCategory', () => {
    mockUseContentRead.mockReturnValue(reviewContent({ primaryCategory: '', contentType: 'Resource', status: 'Live' }));
    render(wrap(<ContentViewPage mode="view" />));
    expect(screen.getByText('Resource')).toBeInTheDocument();
  });
});

describe('ContentViewPage - form load failure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContentRead.mockReturnValue(reviewContent());
  });
  afterEach(() => cleanup());

  it('shows toast when form response has no fields', async () => {
    const { FormService } = await import('@/services/FormService');
    vi.mocked(FormService).prototype.formRead = vi.fn().mockResolvedValue({ data: { form: { data: { fields: null } } } });
    render(wrap(<ContentViewPage mode="review" />));
    fireEvent.click(screen.getByRole('button', { name: /^Publish$/i }));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' })));
  });

  it('shows toast when formRead throws', async () => {
    const { FormService } = await import('@/services/FormService');
    vi.mocked(FormService).prototype.formRead = vi.fn().mockRejectedValue(new Error('fail'));
    render(wrap(<ContentViewPage mode="review" />));
    fireEvent.click(screen.getByRole('button', { name: /^Publish$/i }));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' })));
  });
});

describe('ContentViewPage - Publish confirm flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContentRead.mockReturnValue(reviewContent());
  });
  afterEach(() => cleanup());

  it('publishes content and navigates to workspace on confirm', async () => {
    render(wrap(<ContentViewPage mode="review" />));
    fireEvent.click(screen.getByRole('button', { name: /^Publish$/i }));
    await waitFor(() => expect(screen.getByTestId('checklist-dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('confirm-publish'));
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success' }));
      expect(mockNavigate).toHaveBeenCalledWith('/workspace');
    });
  });

  it('shows error toast when publish fails', async () => {
    const { ContentService } = await import('@/services/ContentService');
    vi.mocked(ContentService).prototype.contentPublish = vi.fn().mockRejectedValue(new Error('fail'));
    render(wrap(<ContentViewPage mode="review" />));
    fireEvent.click(screen.getByRole('button', { name: /^Publish$/i }));
    await waitFor(() => expect(screen.getByTestId('checklist-dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('confirm-publish'));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' })));
  });
});

describe('ContentViewPage - Request Changes confirm flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContentRead.mockReturnValue(reviewContent());
  });
  afterEach(() => cleanup());

  it('submits request for changes and navigates to workspace', async () => {
    render(wrap(<ContentViewPage mode="review" />));
    fireEvent.click(screen.getByRole('button', { name: /Request for Changes/i }));
    await waitFor(() => expect(screen.getByTestId('checklist-dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('confirm-reject'));
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success' }));
      expect(mockNavigate).toHaveBeenCalledWith('/workspace');
    });
  });

  it('shows error toast when reject fails', async () => {
    const { ContentService } = await import('@/services/ContentService');
    vi.mocked(ContentService).prototype.contentReject = vi.fn().mockRejectedValue(new Error('fail'));
    render(wrap(<ContentViewPage mode="review" />));
    fireEvent.click(screen.getByRole('button', { name: /Request for Changes/i }));
    await waitFor(() => expect(screen.getByTestId('checklist-dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('confirm-reject'));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' })));
  });
});

describe('ContentViewPage - ECML content paths', () => {
  afterEach(() => cleanup());

  const ecmlContent = () => reviewContent({ mimeType: 'application/vnd.ekstep.ecml-archive' });

  it('shows publish warning when ECML content has comments', async () => {
    vi.clearAllMocks();
    mockUseContentRead.mockReturnValue(ecmlContent());
    const { default: rcs } = await import('@/services/ReviewCommentService');
    vi.mocked(rcs.hasComments).mockResolvedValue(true);
    render(wrap(<ContentViewPage mode="review" />));
    fireEvent.click(screen.getByRole('button', { name: /^Publish$/i }));
    await waitFor(() => expect(screen.getByTestId('publish-warning-dialog')).toBeInTheDocument());
  });

  it('deletes comments and publishes when ECML publish warning is confirmed', async () => {
    vi.clearAllMocks();
    mockUseContentRead.mockReturnValue(ecmlContent());
    const { default: rcs } = await import('@/services/ReviewCommentService');
    vi.mocked(rcs.hasComments).mockResolvedValue(true);
    vi.mocked(rcs.deleteComments).mockResolvedValue(undefined as any);
    render(wrap(<ContentViewPage mode="review" />));
    fireEvent.click(screen.getByRole('button', { name: /^Publish$/i }));
    await waitFor(() => expect(screen.getByTestId('publish-warning-dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('warning-confirm'));
    await waitFor(() => expect(screen.getByTestId('checklist-dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('confirm-publish'));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'success' })));
  });

  it('closes publish warning when Cancel is clicked', async () => {
    vi.clearAllMocks();
    mockUseContentRead.mockReturnValue(ecmlContent());
    const { default: rcs } = await import('@/services/ReviewCommentService');
    vi.mocked(rcs.hasComments).mockResolvedValue(true);
    render(wrap(<ContentViewPage mode="review" />));
    fireEvent.click(screen.getByRole('button', { name: /^Publish$/i }));
    await waitFor(() => expect(screen.getByTestId('publish-warning-dialog')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('warning-close'));
    await waitFor(() => expect(screen.queryByTestId('publish-warning-dialog')).not.toBeInTheDocument());
  });
});
