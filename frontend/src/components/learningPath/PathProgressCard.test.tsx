import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PathProgressCard } from './PathProgressCard';
import type { PathProgressInfo } from '@/types/learningPathTypes';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

function progress(overrides: Partial<PathProgressInfo> = {}): PathProgressInfo {
  return { pct: 40, completed: 2, total: 5, doneLevels: 1, levelCount: 2, ...overrides };
}

describe('PathProgressCard', () => {
  it('renders the completion summary and progress bar', () => {
    render(<PathProgressCard progress={progress({ pct: 40 })} policy="Fixed" courseTotal={4} scopeCount={3} />);

    expect(screen.getByTestId('path-progress-card')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
  });

  it('renders one stat column per always-present stat', () => {
    render(<PathProgressCard progress={progress()} policy="Diagnostic" courseTotal={4} scopeCount={3} />);

    // Policy, Levels, Courses linked, Skills scoped — batchEndDate omitted.
    expect(screen.getAllByTestId('path-progress-stat')).toHaveLength(4);
    expect(screen.getByText('learningPath.policyAdaptive')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('adds a batch-ends stat column only when a batchEndDate is provided', () => {
    render(
      <PathProgressCard
        progress={progress()}
        policy="Fixed"
        courseTotal={4}
        scopeCount={3}
        batchEndDate="12 Dec 2026"
      />
    );

    expect(screen.getAllByTestId('path-progress-stat')).toHaveLength(5);
    expect(screen.getByText('12 Dec 2026')).toBeInTheDocument();
  });
});
