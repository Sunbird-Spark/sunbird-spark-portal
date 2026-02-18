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

describe('BatchCard', () => {
  const defaultProps = { collectionId: 'test-collection-123' };

  beforeEach(() => {
    vi.clearAllMocks();
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
