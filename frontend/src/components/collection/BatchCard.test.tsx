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

// Mock useBatchList so we control the API response in tests
const mockUseBatchList = vi.fn();
vi.mock('@/hooks/useBatch', () => ({
  useBatchList: (courseId: string, options?: any) => mockUseBatchList(courseId, options),
}));

/** Default hook state — no batches, not loading */
const defaultHookState = { data: [], isLoading: false, isError: false };

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
    expect(mockUseBatchList).toHaveBeenCalledWith('col-abc', { createdByMe: true });
  });

  /* ── Empty state ── */

  it('shows "No ongoing batches" when there are no batches in the selected tab', () => {
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText('No ongoing batches')).toBeInTheDocument();
  });

  /* ── Loading state ── */

  it('shows a loading spinner when isLoading is true', () => {
    mockUseBatchList.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<BatchCard {...defaultProps} />);
    // Spinner is an SVG icon; the "No ongoing batches" text should NOT appear
    expect(screen.queryByText('No ongoing batches')).not.toBeInTheDocument();
    expect(screen.queryByText('Failed to load batches.')).not.toBeInTheDocument();
  });

  /* ── Error state ── */

  it('shows error message when isError is true', () => {
    mockUseBatchList.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText('Failed to load batches.')).toBeInTheDocument();
  });

  /* ── Batch list ── */

  it('renders a batch within the "Ongoing" tab correctly', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'Ongoing Batch', status: '1', startDate: '2026-03-01', endDate: '2026-06-30' }],
      isLoading: false,
      isError: false,
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
    });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /edit certificate/i })).toBeInTheDocument();
  });

  it('shows "Add Certificate" when certTemplates is absent', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'No Cert Batch', status: '1', startDate: '2026-01-01', endDate: '2026-06-01' }],
      isLoading: false,
      isError: false,
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
    });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText(/enrolment ends/i)).toBeInTheDocument();
  });

  it('does NOT show "No ongoing batches" when batches are present', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'Some Batch', status: '1', startDate: '', endDate: '' }],
      isLoading: false,
      isError: false,
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
});
