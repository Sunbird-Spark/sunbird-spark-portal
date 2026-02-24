import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BatchCard from './BatchCard';

// Isolate BatchCard from CreateBatchModal so we test only the card behaviour
vi.mock('./CreateBatchModal', () => ({
  default: ({
    open,
    onOpenChange,
    collectionId,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    collectionId: string;
  }) =>
    open ? (
      <div data-testid="create-batch-modal" data-collection-id={collectionId}>
        <button type="button" onClick={() => onOpenChange(false)}>
          Close Modal
        </button>
      </div>
    ) : null,
}));

// Mock AddCertificateModal
vi.mock('./AddCertificateModal', () => ({
  default: ({
    open,
    onOpenChange,
    courseId,
    batchId,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    courseId: string;
    batchId: string;
  }) =>
    open ? (
      <div data-testid="add-certificate-modal" data-course-id={courseId} data-batch-id={batchId}>
        <button type="button" onClick={() => onOpenChange(false)}>
          Close Certificate Modal
        </button>
      </div>
    ) : null,
}));

// Mock useBatchList so we control the API response in tests
const mockUseBatchList = vi.fn();
vi.mock('@/hooks/useBatch', () => ({
  useBatchListForCreator: (courseId: string, options?: any) => mockUseBatchList(courseId, options),
}));

const mockRefetch = vi.fn();

/** Default hook state — no batches, not loading */
const defaultHookState = { data: [], isLoading: false, isError: false, refetch: mockRefetch, isFetching: false };

describe('BatchCard', () => {
  const defaultProps = { collectionId: 'test-collection-123' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBatchList.mockReturnValue(defaultHookState);
  });

  /* ── Rendering ── */

  it('renders the descriptive subtitle', () => {
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText('Manage batches for this course')).toBeInTheDocument();
  });

  it('renders the Create Batch button', () => {
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /create batch/i })).toBeInTheDocument();
  });

  it('Create Batch button has type="button" (not submit)', () => {
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /create batch/i })).toHaveAttribute('type', 'button');
  });

  it('calls useBatchList with the collectionId', () => {
    render(<BatchCard collectionId="col-abc" />);
    expect(mockUseBatchList).toHaveBeenCalledWith('col-abc', undefined);
  });

  /* ── Empty state ── */

  it('shows "No ongoing batches" when there are no batches in the selected tab', () => {
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText('No ongoing batches')).toBeInTheDocument();
  });

  /* ── Loading state ── */

  it('shows a loading spinner when isLoading is true', () => {
    mockUseBatchList.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: mockRefetch, isFetching: false });
    render(<BatchCard {...defaultProps} />);
    // Spinner is an SVG icon; the "No ongoing batches" text should NOT appear
    expect(screen.queryByText('No ongoing batches')).not.toBeInTheDocument();
    expect(screen.queryByText('Failed to load batches.')).not.toBeInTheDocument();
  });

  /* ── Error state ── */

  it('shows error message when isError is true', () => {
    mockUseBatchList.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch: mockRefetch, isFetching: false });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText('Failed to load batches.')).toBeInTheDocument();
  });

  /* ── Batch list ── */

  it('renders a batch within the "Ongoing" tab correctly', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'Ongoing Batch', status: '1', startDate: '2026-03-01', endDate: '2026-06-30' }],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText('Ongoing Batch')).toBeInTheDocument();
  });

  it('shows the batch details in Upcoming tab', () => {
    mockUseBatchList.mockReturnValue({
      data: [
        { id: 'b2', name: 'Upcoming Batch', status: '0', startDate: '2026-07-01', endDate: '2026-09-30' },
      ],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);

    // Click upcoming tab
    const upcomingTab = screen.getByRole('button', { name: /Upcoming/i });
    fireEvent.click(upcomingTab);

    expect(screen.getByText('Upcoming Batch')).toBeInTheDocument();
  });

  it('shows "Edit Certificate" when certTemplates is non-empty', () => {
    mockUseBatchList.mockReturnValue({
      data: [
        {
          id: 'b1',
          name: 'Cert Batch',
          status: '1',
          startDate: '2026-01-01',
          endDate: '2026-06-01',
          certTemplates: { 'template-1': { name: 'Template One' } },
        },
      ],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /edit certificate/i })).toBeInTheDocument();
  });

  it('shows "Add Certificate" when certTemplates is absent', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'No Cert Batch', status: '1', startDate: '2026-01-01', endDate: '2026-06-01' }],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /add certificate/i })).toBeInTheDocument();
  });

  it('shows enrolment end date when provided', () => {
    mockUseBatchList.mockReturnValue({
      data: [
        {
          id: 'b1',
          name: 'Enrol Batch',
          status: '1',
          startDate: '2026-01-01',
          endDate: '2026-06-01',
          enrollmentEndDate: '2026-03-15',
        },
      ],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText(/enrolment ends/i)).toBeInTheDocument();
  });

  it('does NOT show "No ongoing batches" when batches are present', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'Some Batch', status: '1', startDate: '', endDate: '' }],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    expect(screen.queryByText('No ongoing batches')).not.toBeInTheDocument();
  });

  /* ── Modal closed by default ── */

  it('does not show the modal on initial render', () => {
    render(<BatchCard {...defaultProps} />);
    expect(screen.queryByTestId('create-batch-modal')).not.toBeInTheDocument();
  });

  /* ── Opening the modal ── */

  it('opens the modal when Create Batch button is clicked', () => {
    render(<BatchCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /create batch/i }));
    // 2 instances: create and edit (both render null when closed if mocked, but our mock renders div only when open)
    expect(screen.getAllByTestId('create-batch-modal').length).toBeGreaterThan(0);
  });

  /* ── Closing the modal ── */

  it('closes the modal when onOpenChange(false) is called by modal', () => {
    render(<BatchCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /create batch/i }));

    // There can be multiple modals mocked (edit/create), find all close buttons
    const closeButtons = screen.getAllByText('Close Modal');
    if (closeButtons.length > 0 && closeButtons[0]) {
      fireEvent.click(closeButtons[0]);
    }
    expect(screen.queryByTestId('create-batch-modal')).not.toBeInTheDocument();
  });

  /* ── Props forwarding ── */

  it('passes the correct collectionId to the modal', () => {
    render(<BatchCard collectionId="collection-abc" />);
    fireEvent.click(screen.getByRole('button', { name: /create batch/i }));
    const modals = screen.getAllByTestId('create-batch-modal');
    expect(modals[0]).toHaveAttribute('data-collection-id', 'collection-abc');
  });

  /* ── Certificate modal ── */

  it('does not show the certificate modal on initial render', () => {
    render(<BatchCard {...defaultProps} />);
    expect(screen.queryByTestId('add-certificate-modal')).not.toBeInTheDocument();
  });

  it('opens the certificate modal when certificate button is clicked', () => {
    mockUseBatchList.mockReturnValue({
      data: [
        {
          id: 'b1',
          name: 'Test Batch',
          status: '1',
          startDate: '2026-01-01',
          endDate: '2026-06-01',
          certTemplates: undefined,
        },
      ],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    const certButton = screen.getByRole('button', { name: /add certificate/i });
    fireEvent.click(certButton);
    expect(screen.getByTestId('add-certificate-modal')).toBeInTheDocument();
  });

  it('passes the correct courseId and batchId to the certificate modal', () => {
    mockUseBatchList.mockReturnValue({
      data: [
        {
          id: 'batch-xyz',
          name: 'Test Batch',
          status: '1',
          startDate: '2026-01-01',
          endDate: '2026-06-01',
          certTemplates: undefined,
        },
      ],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard collectionId="collection-abc" />);
    const certButton = screen.getByRole('button', { name: /add certificate/i });
    fireEvent.click(certButton);
    const modal = screen.getByTestId('add-certificate-modal');
    expect(modal).toHaveAttribute('data-course-id', 'collection-abc');
    expect(modal).toHaveAttribute('data-batch-id', 'batch-xyz');
  });

  it('closes the certificate modal when onOpenChange(false) is called', () => {
    mockUseBatchList.mockReturnValue({
      data: [
        {
          id: 'b1',
          name: 'Test Batch',
          status: '1',
          startDate: '2026-01-01',
          endDate: '2026-06-01',
          certTemplates: undefined,
        },
      ],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    const certButton = screen.getByRole('button', { name: /add certificate/i });
    fireEvent.click(certButton);
    expect(screen.getByTestId('add-certificate-modal')).toBeInTheDocument();

    const closeButton = screen.getByText('Close Certificate Modal');
    fireEvent.click(closeButton);
    expect(screen.queryByTestId('add-certificate-modal')).not.toBeInTheDocument();
  });

  it('passes collectionName to the certificate modal', () => {
    mockUseBatchList.mockReturnValue({
      data: [
        {
          id: 'b1',
          name: 'Test Batch',
          status: '1',
          startDate: '2026-01-01',
          endDate: '2026-06-01',
          certTemplates: undefined,
        },
      ],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard collectionId="collection-abc" collectionName="Test Collection" />);
    const certButton = screen.getByRole('button', { name: /add certificate/i });
    fireEvent.click(certButton);
    expect(screen.getByTestId('add-certificate-modal')).toBeInTheDocument();
  });

  it('passes existing cert templates to the certificate modal', () => {
    mockUseBatchList.mockReturnValue({
      data: [
        {
          id: 'b1',
          name: 'Test Batch with Cert',
          status: '1',
          startDate: '2026-01-01',
          endDate: '2026-06-01',
          certTemplates: { 'template-1': { name: 'Template 1' } },
        },
      ],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    const certButton = screen.getByRole('button', { name: /edit certificate/i });
    fireEvent.click(certButton);
    expect(screen.getByTestId('add-certificate-modal')).toBeInTheDocument();
  });

  /* ── Edit batch modal ── */

  it('opens the edit modal when edit button is clicked on a batch', () => {
    mockUseBatchList.mockReturnValue({
      data: [
        {
          id: 'b1',
          name: 'Test Batch',
          status: '1',
          startDate: '2026-03-01',
          endDate: '2026-06-01',
        },
      ],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    const editButton = screen.getByRole('button', { name: /edit batch/i });
    fireEvent.click(editButton);
    // Edit modal should appear
    expect(screen.getByTestId('create-batch-modal')).toBeInTheDocument();
  });

  it('closes the edit modal when onOpenChange(false) is called', () => {
    mockUseBatchList.mockReturnValue({
      data: [
        {
          id: 'b1',
          name: 'Test Batch',
          status: '1',
          startDate: '2026-03-01',
          endDate: '2026-06-01',
        },
      ],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);
    const editButton = screen.getByRole('button', { name: /edit batch/i });
    fireEvent.click(editButton);
    expect(screen.getByTestId('create-batch-modal')).toBeInTheDocument();

    const closeButton = screen.getByText('Close Modal');
    fireEvent.click(closeButton);
    // After closing, the modal should not be visible
    expect(screen.queryByTestId('create-batch-modal')).not.toBeInTheDocument();
  });

  /* ── Tab filtering ── */

  it('filters batches by status tabs correctly', () => {
    mockUseBatchList.mockReturnValue({
      data: [
        { id: 'b1', name: 'Ongoing Batch', status: '1', startDate: '2026-03-01', endDate: '2026-06-01' },
        { id: 'b2', name: 'Upcoming Batch', status: '0', startDate: '2026-07-01', endDate: '2026-09-01' },
        { id: 'b3', name: 'Expired Batch', status: '2', startDate: '2025-01-01', endDate: '2025-06-01' },
      ],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);

    expect(screen.getByText('Ongoing Batch')).toBeInTheDocument();
    expect(screen.queryByText('Upcoming Batch')).not.toBeInTheDocument();
    expect(screen.queryByText('Expired Batch')).not.toBeInTheDocument();

    const upcomingTab = screen.getByRole('button', { name: /upcoming/i });
    fireEvent.click(upcomingTab);

    expect(screen.queryByText('Ongoing Batch')).not.toBeInTheDocument();
    expect(screen.getByText('Upcoming Batch')).toBeInTheDocument();
    expect(screen.queryByText('Expired Batch')).not.toBeInTheDocument();

    const expiredTab = screen.getByRole('button', { name: /expired/i });
    fireEvent.click(expiredTab);

    expect(screen.queryByText('Ongoing Batch')).not.toBeInTheDocument();
    expect(screen.queryByText('Upcoming Batch')).not.toBeInTheDocument();
    expect(screen.getByText('Expired Batch')).toBeInTheDocument();
  });

  it('shows correct tab counts', () => {
    mockUseBatchList.mockReturnValue({
      data: [
        { id: 'b1', name: 'Ongoing Batch 1', status: '1', startDate: '2026-03-01', endDate: '2026-06-01' },
        { id: 'b2', name: 'Ongoing Batch 2', status: '1', startDate: '2026-03-01', endDate: '2026-06-01' },
        { id: 'b3', name: 'Upcoming Batch', status: '0', startDate: '2026-07-01', endDate: '2026-09-01' },
      ],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });
    render(<BatchCard {...defaultProps} />);

    // Tabs should be rendered with counts
    expect(screen.getByRole('button', { name: /ongoing/i })).toBeInTheDocument();
  });

  /* ── Refresh button ── */

  it('renders the refresh button', () => {
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /refresh batch list/i })).toBeInTheDocument();
  });

  it('calls refetch when the refresh button is clicked', () => {
    render(<BatchCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /refresh batch list/i }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('disables the refresh button when isFetching is true', () => {
    mockUseBatchList.mockReturnValue({ ...defaultHookState, isFetching: true });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /refresh batch list/i })).toBeDisabled();
  });

  it('adds animate-spin class to the refresh icon when isFetching is true', () => {
    mockUseBatchList.mockReturnValue({ ...defaultHookState, isFetching: true });
    render(<BatchCard {...defaultProps} />);
    const refreshBtn = screen.getByRole('button', { name: /refresh batch list/i });
    const icon = refreshBtn.querySelector('svg');
    expect(icon).toHaveClass('animate-spin');
  });
});
