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
  useBatchList: (courseId: string) => mockUseBatchList(courseId),
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
    expect(mockUseBatchList).toHaveBeenCalledWith('col-abc');
  });

  /* ── Empty state ── */

  it('shows "No batches created yet" when there are no batches', () => {
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText('No batches created yet.')).toBeInTheDocument();
  });

  /* ── Loading state ── */

  it('shows a loading spinner when isLoading is true', () => {
    mockUseBatchList.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<BatchCard {...defaultProps} />);
    // Spinner is an SVG icon; the "No batches" text should NOT appear
    expect(screen.queryByText('No batches created yet.')).not.toBeInTheDocument();
    expect(screen.queryByText('Failed to load batches.')).not.toBeInTheDocument();
  });

  /* ── Error state ── */

  it('shows error message when isError is true', () => {
    mockUseBatchList.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText('Failed to load batches.')).toBeInTheDocument();
  });

  /* ── Batch list ── */

  it('renders the first batch name directly when there is only one batch', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'Solo Batch', status: '1', startDate: '2026-03-01', endDate: '2026-06-30' }],
      isLoading: false,
      isError: false,
    });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText('Solo Batch')).toBeInTheDocument();
    // No dropdown for a single batch
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('shows a dropdown when there are multiple batches', () => {
    mockUseBatchList.mockReturnValue({
      data: [
        { id: 'b1', name: 'Batch Alpha', status: '1', startDate: '2026-03-01', endDate: '2026-06-30' },
        { id: 'b2', name: 'Batch Beta', status: '0', startDate: '2026-07-01', endDate: '2026-09-30' },
      ],
      isLoading: false,
      isError: false,
    });
    render(<BatchCard {...defaultProps} />);

    // Dropdown is rendered
    const dropdown = screen.getByRole('combobox', { name: /select batch/i });
    expect(dropdown).toBeInTheDocument();

    // Both batches appear as options
    const options = Array.from(dropdown.querySelectorAll('option'));
    expect(options.some((o) => o.textContent?.includes('Batch Alpha'))).toBe(true);
    expect(options.some((o) => o.textContent?.includes('Batch Beta'))).toBe(true);

    // First batch is displayed in the detail panel by default
    expect(screen.getByText('Batch Alpha')).toBeInTheDocument();
  });

  it('shows "Ongoing" badge for status "1"', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'My Batch', status: '1', startDate: '2026-01-01', endDate: '2026-06-01' }],
      isLoading: false,
      isError: false,
    });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText('Ongoing')).toBeInTheDocument();
  });

  it('shows "Upcoming" badge for status "0"', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'My Batch', status: '0', startDate: '2026-08-01', endDate: '2026-12-01' }],
      isLoading: false,
      isError: false,
    });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
  });

  it('shows "Expired" badge for status "2"', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'My Batch', status: '2', startDate: '2025-01-01', endDate: '2025-06-01' }],
      isLoading: false,
      isError: false,
    });
    render(<BatchCard {...defaultProps} />);
    expect(screen.getByText('Expired')).toBeInTheDocument();
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

  it('does NOT show "No batches created yet" when batches are present', () => {
    mockUseBatchList.mockReturnValue({
      data: [{ id: 'b1', name: 'Some Batch', status: '1', startDate: '', endDate: '' }],
      isLoading: false,
      isError: false,
    });
    render(<BatchCard {...defaultProps} />);
    expect(screen.queryByText('No batches created yet.')).not.toBeInTheDocument();
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
    expect(screen.getByTestId('create-batch-modal')).toBeInTheDocument();
  });

  /* ── Closing the modal ── */

  it('closes the modal when onOpenChange(false) is called by modal', () => {
    render(<BatchCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /create batch/i }));
    expect(screen.getByTestId('create-batch-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close Modal'));
    expect(screen.queryByTestId('create-batch-modal')).not.toBeInTheDocument();
  });

  it('can re-open the modal after closing it', () => {
    render(<BatchCard {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /create batch/i }));
    fireEvent.click(screen.getByText('Close Modal'));
    fireEvent.click(screen.getByRole('button', { name: /create batch/i }));

    expect(screen.getByTestId('create-batch-modal')).toBeInTheDocument();
  });

  /* ── Props forwarding ── */

  it('passes the correct collectionId to the modal', () => {
    render(<BatchCard collectionId="collection-abc" />);
    fireEvent.click(screen.getByRole('button', { name: /create batch/i }));
    expect(screen.getByTestId('create-batch-modal')).toHaveAttribute(
      'data-collection-id',
      'collection-abc'
    );
  });
});
