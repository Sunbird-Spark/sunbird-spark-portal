import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  // Regression: the policy explainer used to be an always-visible banner
  // (PolicyNoteBanner, now removed) - it must only appear once the info icon
  // next to "Policy" is clicked (see: policy note as click-to-reveal info).
  describe('policy info popover', () => {
    it('does not show the policy note until the info icon is clicked', () => {
      render(<PathProgressCard progress={progress()} policy="Fixed" courseTotal={4} scopeCount={3} />);

      expect(screen.queryByText('learningPath.policyNoteStrict')).not.toBeInTheDocument();
    });

    it('reveals the matching policy note on click', () => {
      render(<PathProgressCard progress={progress()} policy="Fixed" courseTotal={4} scopeCount={3} />);

      fireEvent.click(screen.getByTestId('policy-info-trigger'));

      expect(screen.getByText('learningPath.policyNoteStrict')).toBeInTheDocument();
    });

    it('shows the adaptive/prior-learning note for the matching policy', () => {
      render(<PathProgressCard progress={progress()} policy="PriorLearning" courseTotal={4} scopeCount={3} />);

      fireEvent.click(screen.getByTestId('policy-info-trigger'));

      expect(screen.getByText('learningPath.policyNotePriorLearning')).toBeInTheDocument();
    });
  });

  // Same click-to-reveal pattern extended to Levels/Courses linked/Skills
  // scoped, so users can learn what each stat means (see: extend info
  // popover pattern to Levels/Courses linked/Skills scoped).
  describe.each([
    ['levels', 'levelsNote'],
    ['courses-linked', 'coursesLinkedNote'],
    ['skills-scoped', 'skillsScopedNote'],
  ])('%s info popover', (testId, noteKey) => {
    it('does not show the note until the info icon is clicked', () => {
      render(<PathProgressCard progress={progress()} policy="Fixed" courseTotal={4} scopeCount={3} />);

      expect(screen.queryByText(`learningPath.${noteKey}`)).not.toBeInTheDocument();
    });

    it('reveals the note on click', () => {
      render(<PathProgressCard progress={progress()} policy="Fixed" courseTotal={4} scopeCount={3} />);

      fireEvent.click(screen.getByTestId(`${testId}-info-trigger`));

      expect(screen.getByText(`learningPath.${noteKey}`)).toBeInTheDocument();
    });
  });
});
