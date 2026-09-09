import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LearningPathCreatorPanel } from './LearningPathCreatorPanel';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('@/components/collection/BatchCard', () => ({
  default: ({ collectionId, title }: { collectionId: string; title?: string }) => (
    <div data-testid="batch-card">
      {collectionId} · {title}
    </div>
  ),
}));

describe('LearningPathCreatorPanel', () => {
  it('navigates to the Learning Path dashboard route on click', () => {
    render(<LearningPathCreatorPanel pathId="lp1" pathName="My Path" />);

    fireEvent.click(screen.getByTestId('view-path-dashboard-btn'));

    expect(mockNavigate).toHaveBeenCalledWith('/learning-path/lp1/dashboard/batches');
  });

  it('passes the path id and an LP-specific title down to BatchCard', () => {
    render(<LearningPathCreatorPanel pathId="lp1" pathName="My Path" />);

    expect(screen.getByTestId('batch-card')).toHaveTextContent('lp1 · learningPath.manageBatches');
  });
});
