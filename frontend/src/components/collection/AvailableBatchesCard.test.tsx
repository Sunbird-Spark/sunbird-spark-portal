import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AvailableBatchesCard from './AvailableBatchesCard';
import type { BatchListItem } from '@/types/collectionTypes';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
  }),
}));

const mockBatches: BatchListItem[] = [
  {
    identifier: 'batch-1',
    name: 'Batch 1',
    startDate: '2025-01-01',
    endDate: '2025-06-01',
    enrollmentEndDate: '2025-05-15',
    status: 1,
  },
  {
    identifier: 'batch-2',
    name: 'Batch 2',
    startDate: '2025-02-01',
    endDate: undefined,
    enrollmentEndDate: null,
    status: 0,
  },
];

describe('AvailableBatchesCard', () => {
  it('renders card with test id and available batches heading', () => {
    render(
      <AvailableBatchesCard
        batches={[]}
        selectedBatchId=""
        onBatchSelect={vi.fn()}
        onJoinCourse={vi.fn()}
      />
    );
    expect(screen.getByTestId('available-batches-card')).toBeInTheDocument();
    expect(screen.getByText('courseDetails.availableBatches')).toBeInTheDocument();
  });

  it('shows empty state when batches is empty and not loading', () => {
    render(
      <AvailableBatchesCard
        batches={[]}
        selectedBatchId=""
        onBatchSelect={vi.fn()}
        onJoinCourse={vi.fn()}
      />
    );
    expect(screen.getByText('courseDetails.noBatchesAvailable')).toBeInTheDocument();
    expect(screen.queryByTestId('batch-select')).not.toBeInTheDocument();
  });

  it('shows select batch and dropdown when batches exist', () => {
    render(
      <AvailableBatchesCard
        batches={mockBatches}
        selectedBatchId=""
        onBatchSelect={vi.fn()}
        onJoinCourse={vi.fn()}
      />
    );
    expect(screen.getByText('courseDetails.selectBatchToStart')).toBeInTheDocument();
    expect(screen.getByTestId('batch-select')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'courseDetails.joinTheCourse' })).toBeInTheDocument();
  });

  it('shows selected batch name in trigger when selectedBatchId is set', () => {
    render(
      <AvailableBatchesCard
        batches={mockBatches}
        selectedBatchId="batch-1"
        onBatchSelect={vi.fn()}
        onJoinCourse={vi.fn()}
      />
    );
    expect(screen.getByText('Batch 1')).toBeInTheDocument();
  });

  it('calls onBatchSelect when a batch option is clicked', () => {
    const onBatchSelect = vi.fn();
    render(
      <AvailableBatchesCard
        batches={mockBatches}
        selectedBatchId=""
        onBatchSelect={onBatchSelect}
        onJoinCourse={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('batch-select'));
    expect(screen.getByTestId('batch-select-list')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Batch 1'));
    expect(onBatchSelect).toHaveBeenCalledWith('batch-1');
  });

  it('calls onJoinCourse when join button is clicked', () => {
    const onJoinCourse = vi.fn();
    render(
      <AvailableBatchesCard
        batches={mockBatches}
        selectedBatchId="batch-1"
        onBatchSelect={vi.fn()}
        onJoinCourse={onJoinCourse}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'courseDetails.joinTheCourse' }));
    expect(onJoinCourse).toHaveBeenCalled();
  });

  it('disables join button when no batch selected', () => {
    render(
      <AvailableBatchesCard
        batches={mockBatches}
        selectedBatchId=""
        onBatchSelect={vi.fn()}
        onJoinCourse={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'courseDetails.joinTheCourse' })).toBeDisabled();
  });

  it('disables join button when joinLoading is true', () => {
    render(
      <AvailableBatchesCard
        batches={mockBatches}
        selectedBatchId="batch-1"
        onBatchSelect={vi.fn()}
        onJoinCourse={vi.fn()}
        joinLoading={true}
      />
    );
    expect(screen.getByRole('button', { name: 'loading' })).toBeDisabled();
  });

  it('shows error message when error prop is set', () => {
    render(
      <AvailableBatchesCard
        batches={[]}
        selectedBatchId=""
        onBatchSelect={vi.fn()}
        onJoinCourse={vi.fn()}
        error="Failed to load batches"
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load batches');
  });

  it('shows joinError when joinError is set', () => {
    render(
      <AvailableBatchesCard
        batches={mockBatches}
        selectedBatchId="batch-1"
        onBatchSelect={vi.fn()}
        onJoinCourse={vi.fn()}
        joinError="Enrollment failed"
      />
    );
    const alerts = screen.getAllByRole('alert');
    expect(alerts.some((el) => el.textContent === 'Enrollment failed')).toBe(true);
  });

  it('disables batch select button when isLoading', () => {
    render(
      <AvailableBatchesCard
        batches={mockBatches}
        selectedBatchId=""
        onBatchSelect={vi.fn()}
        onJoinCourse={vi.fn()}
        isLoading={true}
      />
    );
    expect(screen.getByTestId('batch-select')).toBeDisabled();
  });

  it('uses batch identifier as fallback when name is missing', () => {
    const batchesNoName: BatchListItem[] = [{ identifier: 'id-only-batch' }];
    render(
      <AvailableBatchesCard
        batches={batchesNoName}
        selectedBatchId="id-only-batch"
        onBatchSelect={vi.fn()}
        onJoinCourse={vi.fn()}
      />
    );
    expect(screen.getByText('id-only-batch')).toBeInTheDocument();
  });
});
