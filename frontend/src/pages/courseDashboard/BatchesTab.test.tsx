import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BatchesTab from './BatchesTab';
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

  it('renders list of batches and selects one', () => {
    const mockBatches = [
      { id: 'b1', name: 'Batch 1' },
      { id: 'b2', name: 'Batch 2' },
    ];
    (useBatchListForCreator as any).mockReturnValue({
      data: mockBatches,
      isLoading: false,
      isError: false,
    });

    render(<BatchesTab collectionId="col_123" />);

    expect(screen.getByTestId('batch-item-b1')).toBeInTheDocument();
    expect(screen.getByTestId('batch-item-b2')).toBeInTheDocument();
    expect(screen.getByTestId('no-batch-selected')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('batch-item-b2'));

    expect(screen.getByTestId('selected-batch-panel')).toBeInTheDocument();
    expect(screen.getByTestId('selected-batch-panel')).toHaveTextContent('Batch 2');
    expect(screen.getByTestId('selected-batch-panel')).toHaveTextContent('Batch ID: b2');
  });
});
