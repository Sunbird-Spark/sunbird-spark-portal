import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssessmentGate } from './AssessmentGate';
import type { LPCourseNode } from '@/types/learningPathTypes';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({ t: (key: string) => key }),
}));

const assessment: LPCourseNode = {
  identifier: 'course_assess',
  name: 'LP-Assess-Course',
  leafNodesCount: 1,
  leafIds: ['qs_1'],
  skills: ['Python Programming'],
  isAssessmentCourse: true,
  questionCount: 5,
};

describe('AssessmentGate', () => {
  describe('variant="prior"', () => {
    it('shows the prior sub-label and policy note', () => {
      render(
        <AssessmentGate
          variant="prior"
          assessment={assessment}
          policy="Fixed"
          allSkills={['Python Programming']}
          onStart={vi.fn()}
          onBack={vi.fn()}
          onSkip={vi.fn()}
        />,
      );
      expect(screen.getByText('learningPath.priorAssessmentSub')).toBeInTheDocument();
      expect(screen.getByText('learningPath.beforeThePathOpens')).toBeInTheDocument();
      expect(screen.getByText('learningPath.policyNoteStrict')).toBeInTheDocument();
    });

    it('shows Skip only when the policy is Fixed', () => {
      const { rerender } = render(
        <AssessmentGate
          variant="prior"
          assessment={assessment}
          policy="Fixed"
          allSkills={[]}
          onStart={vi.fn()}
          onBack={vi.fn()}
          onSkip={vi.fn()}
        />,
      );
      expect(screen.getByText('learningPath.skipAndStartLevel1')).toBeInTheDocument();

      rerender(
        <AssessmentGate
          variant="prior"
          assessment={assessment}
          policy="Diagnostic"
          allSkills={[]}
          onStart={vi.fn()}
          onBack={vi.fn()}
          onSkip={vi.fn()}
        />,
      );
      expect(screen.queryByText('learningPath.skipAndStartLevel1')).not.toBeInTheDocument();
    });

    it('does not show Skip when no onSkip handler is provided even if the policy is Fixed', () => {
      render(
        <AssessmentGate
          variant="prior"
          assessment={assessment}
          policy="Fixed"
          allSkills={[]}
          onStart={vi.fn()}
          onBack={vi.fn()}
        />,
      );
      expect(screen.queryByText('learningPath.skipAndStartLevel1')).not.toBeInTheDocument();
    });
  });

  describe('variant="outcome"', () => {
    it('shows the outcome sub-label and note, never a Skip button', () => {
      render(
        <AssessmentGate
          variant="outcome"
          assessment={assessment}
          allSkills={['Python Programming']}
          onStart={vi.fn()}
          onBack={vi.fn()}
        />,
      );
      expect(screen.getByText('learningPath.outcomeAssessmentSub')).toBeInTheDocument();
      expect(screen.getByText('learningPath.beforeTheFinalAssessment')).toBeInTheDocument();
      expect(screen.getByText('learningPath.outcomeAssessmentNote')).toBeInTheDocument();
      expect(screen.queryByText('learningPath.skipAndStartLevel1')).not.toBeInTheDocument();
    });

    // Even if a caller mistakenly passed policy + onSkip for an outcome gate, it must
    // never offer to skip the path's own completion gate.
    it('ignores policy/onSkip for the outcome variant', () => {
      render(
        <AssessmentGate
          variant="outcome"
          assessment={assessment}
          policy="Fixed"
          allSkills={[]}
          onStart={vi.fn()}
          onBack={vi.fn()}
          onSkip={vi.fn()}
        />,
      );
      expect(screen.queryByText('learningPath.skipAndStartLevel1')).not.toBeInTheDocument();
    });
  });

  it('renders score and attempts when known', () => {
    render(
      <AssessmentGate
        variant="prior"
        assessment={assessment}
        policy="Fixed"
        allSkills={[]}
        bestScore={{ score: 8, maxScore: 10, attemptCount: 2 }}
        onStart={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByText('8/10')).toBeInTheDocument();
    expect(screen.getByTestId('assessment-gate-attempts')).toHaveTextContent('2');
  });

  it('shows — for score and attempts when bestScore is absent', () => {
    render(
      <AssessmentGate
        variant="prior"
        assessment={assessment}
        policy="Fixed"
        allSkills={[]}
        onStart={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByTestId('assessment-gate-attempts')).toHaveTextContent('—');
  });

  it('shows — for attempts when the score is known but the attempt count is not', () => {
    render(
      <AssessmentGate
        variant="prior"
        assessment={assessment}
        policy="Fixed"
        allSkills={[]}
        bestScore={{ score: 8, maxScore: 10 }}
        onStart={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByText('8/10')).toBeInTheDocument();
    expect(screen.getByTestId('assessment-gate-attempts')).toHaveTextContent('—');
  });

  it('has a back-to-path link that fires onBack', () => {
    const onBack = vi.fn();
    render(
      <AssessmentGate
        variant="prior"
        assessment={assessment}
        policy="Fixed"
        allSkills={[]}
        onStart={vi.fn()}
        onBack={onBack}
      />,
    );
    fireEvent.click(screen.getByText(/learningPath\.backToPath/));
    expect(onBack).toHaveBeenCalled();
  });

  it('lists all scoped skills and the question count', () => {
    render(
      <AssessmentGate
        variant="prior"
        assessment={assessment}
        policy="Fixed"
        allSkills={['Python Programming', 'JavaScript']}
        onStart={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByText('Python Programming')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
