import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LevelStatusBadge } from './LevelStatusBadge';
import type { LevelStatusKey } from '../../types/learningPathTypes';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

describe('LevelStatusBadge', () => {
  // Regression: `notStarted` and `active` used to share the same
  // `learningPath.statusInProgress` label, so an unenrolled/untouched Level
  // (pct 0, status `notStarted`) displayed "In progress" (see bug: unenrolled
  // Learning Path Level showing "In progress" instead of "Not started").
  it('renders a distinct label for notStarted vs. active', () => {
    render(<LevelStatusBadge status="notStarted" />);
    expect(screen.getByText('status.notStarted')).toBeInTheDocument();
    expect(screen.queryByText('learningPath.statusInProgress')).not.toBeInTheDocument();
  });

  it('still renders the in-progress label for an active Level', () => {
    render(<LevelStatusBadge status="active" />);
    expect(screen.getByText('learningPath.statusInProgress')).toBeInTheDocument();
  });

  it.each<[LevelStatusKey, string]>([
    ['completed', 'learningPath.statusCompleted'],
    ['locked', 'learningPath.statusLocked'],
    ['waived', 'learningPath.statusWaived'],
    ['credited', 'learningPath.statusCredited'],
    ['creditedPending', 'learningPath.statusCreditedPending'],
  ])('renders the expected label for status "%s"', (status, expectedLabel) => {
    render(<LevelStatusBadge status={status} />);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });
});
