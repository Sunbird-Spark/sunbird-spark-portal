import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LearningPathPlayerCard } from './LearningPathPlayerCard';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/players', () => ({
  ContentPlayer: ({ mimeType }: { mimeType: string }) => <div data-testid="content-player">{mimeType}</div>,
}));

const defaultProps = {
  title: 'Reading data honestly',
  crumb: 'Level 1 · Foundations · Unit 1 of 2',
  isCompleted: false,
  hasPrevious: false,
  hasNext: true,
  onPrevious: vi.fn(),
  onNext: vi.fn(),
  playerIsLoading: false,
  playerError: null,
  playerMetadata: { mimeType: 'video/mp4' },
};

describe('LearningPathPlayerCard', () => {
  it('renders the title, crumb, and ContentPlayer', () => {
    render(<LearningPathPlayerCard {...defaultProps} />);
    expect(screen.getByText('Reading data honestly')).toBeInTheDocument();
    expect(screen.getByText('Level 1 · Foundations · Unit 1 of 2')).toBeInTheDocument();
    expect(screen.getByTestId('content-player')).toHaveTextContent('video/mp4');
  });

  it('disables Previous when hasPrevious is false and enables Next when hasNext is true', () => {
    render(<LearningPathPlayerCard {...defaultProps} />);
    expect(screen.getByText('learningPath.previous').closest('button')).toBeDisabled();
    expect(screen.getByText('learningPath.next').closest('button')).not.toBeDisabled();
  });

  it('calls onPrevious/onNext when clicked', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    render(<LearningPathPlayerCard {...defaultProps} hasPrevious onPrevious={onPrevious} onNext={onNext} />);
    fireEvent.click(screen.getByText('learningPath.previous'));
    fireEvent.click(screen.getByText('learningPath.next'));
    expect(onPrevious).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
  });

  it('shows the "Marked complete" badge only when isCompleted', () => {
    const { rerender } = render(<LearningPathPlayerCard {...defaultProps} isCompleted={false} />);
    expect(screen.queryByText('learningPath.markedComplete')).not.toBeInTheDocument();

    rerender(<LearningPathPlayerCard {...defaultProps} isCompleted />);
    expect(screen.getByText('learningPath.markedComplete')).toBeInTheDocument();
  });

  it('shows a loading state and an error state', () => {
    const { rerender } = render(<LearningPathPlayerCard {...defaultProps} playerIsLoading />);
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();

    rerender(<LearningPathPlayerCard {...defaultProps} playerIsLoading={false} playerError={new Error('boom')} />);
    expect(screen.getByText('boom')).toBeInTheDocument();
  });
});
