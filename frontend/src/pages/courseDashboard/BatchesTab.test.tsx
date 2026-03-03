import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BatchesTab from './BatchesTab';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useLocation: vi.fn(() => ({ pathname: '/' })),
  };
});
import { useBatchListForCreator } from '@/hooks/useBatch';

vi.mock('@/hooks/useBatch', () => ({
  useBatchListForCreator: vi.fn(),
}));

vi.mock('@/components/common/PageLoader', () => ({
  default: ({ message, error }: { message?: string; error?: string }) => (
    <div data-testid="page-loader">
      {message && <span>{message}</span>}
      {error && <span>{error}</span>}
    </div>
  ),
}));

vi.mock('@/components/collection/BatchRow', () => ({
  getBatchStatus: (status: string) => {
    if (status === '0') return 'Upcoming';
    if (status === '1') return 'Ongoing';
    return 'Expired';
  },
}));

vi.mock('@/components/reports/CourseReportContent', () => ({
  default: ({ courseId, batchId }: { courseId?: string; batchId?: string }) => (
    <div data-testid="course-report-content">
      Report for course {courseId} batch {batchId}
    </div>
  ),
}));

describe('BatchesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    (useBatchListForCreator as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    render(<BatchesTab collectionId="col_123" />);
    expect(screen.getByTestId('batches-loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    (useBatchListForCreator as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load'),
    });
    render(<BatchesTab collectionId="col_123" />);
    expect(screen.getByTestId('batches-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders empty state when no batches are found', () => {
    (useBatchListForCreator as any).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    render(<BatchesTab collectionId="col_123" />);
    expect(screen.getByText('No batches found.')).toBeInTheDocument();
  });

  it('renders batch select dropdown when batches exist', () => {
    (useBatchListForCreator as any).mockReturnValue({
      data: [{ id: 'b1', name: 'Batch 1', status: '1' }],
      isLoading: false,
      isError: false,
    });
    render(<BatchesTab collectionId="col_123" />);
    expect(screen.getByTestId('batch-select-trigger')).toBeInTheDocument();
  });

  it('shows placeholder text before a batch is selected', () => {
    (useBatchListForCreator as any).mockReturnValue({
      data: [{ id: 'b1', name: 'Batch 1', status: '1' }],
      isLoading: false,
      isError: false,
    });
    render(<BatchesTab collectionId="col_123" />);
    expect(screen.getByTestId('no-batch-selected')).toBeInTheDocument();
    expect(screen.getByText(/select a batch from the dropdown/i)).toBeInTheDocument();
  });

  it('renders main panel', () => {
    (useBatchListForCreator as any).mockReturnValue({
      data: [{ id: 'b1', name: 'Batch 1', status: '1' }],
      isLoading: false,
      isError: false,
    });
    render(<BatchesTab collectionId="col_123" />);
    expect(screen.getByTestId('batches-main-panel')).toBeInTheDocument();
  });

  it('renders Select Batch label', () => {
    (useBatchListForCreator as any).mockReturnValue({
      data: [{ id: 'b1', name: 'Batch 1', status: '1' }],
      isLoading: false,
      isError: false,
    });
    render(<BatchesTab collectionId="col_123" />);
    expect(screen.getByText('Select Batch')).toBeInTheDocument();
  });

  it('handles undefined data as empty list', () => {
    (useBatchListForCreator as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
    render(<BatchesTab collectionId="col_123" />);
    expect(screen.getByText('No batches found.')).toBeInTheDocument();
  });

  it('does not show course report content before batch selection', () => {
    (useBatchListForCreator as any).mockReturnValue({
      data: [{ id: 'b1', name: 'Batch 1', status: '1' }],
      isLoading: false,
      isError: false,
    });
    render(<BatchesTab collectionId="col_123" />);
    expect(screen.queryByTestId('course-report-content')).not.toBeInTheDocument();
  });
});
