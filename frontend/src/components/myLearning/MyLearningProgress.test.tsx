import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyLearningProgress from './MyLearningProgress';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'myLearning.learningProgress': 'Learning Progress',
        'myLearning.lessonVisited': 'Lesson visited',
        'myLearning.contentsCompleted': 'Contents completed',
        'myLearning.skillsGained': 'Skills gained',
        'myLearning.learningPathsCompleted': 'Learning Paths completed',
      };
      return translations[key] ?? key;
    },
  }),
}));

describe('MyLearningProgress', () => {
  const defaultProps = {
    lessonsVisited: 5,
    totalLessons: 10,
    contentsCompleted: 2,
    totalContents: 4,
  };

  it('renders the title correctly', () => {
    render(<MyLearningProgress {...defaultProps} />);
    expect(screen.getByText('Learning Progress')).toBeInTheDocument();
  });

  it('displays the lessons visited and total lessons correctly', () => {
    render(<MyLearningProgress {...defaultProps} />);
    expect(screen.getByText('5/10')).toBeInTheDocument();
    expect(screen.getByText('Lesson visited')).toBeInTheDocument();
  });

  it('displays the contents completed and total contents correctly', () => {
    render(<MyLearningProgress {...defaultProps} />);
    expect(screen.getByText('2/4')).toBeInTheDocument();
    expect(screen.getByText('Contents completed')).toBeInTheDocument();
  });

  it('renders progress rings with center text', () => {
    render(<MyLearningProgress {...defaultProps} />);
    // The center text is the lessonsVisited (as per code)
    expect(screen.getByText('5')).toBeInTheDocument();
    
    // Check for SVG circles
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    const circles = svg?.querySelectorAll('circle');
    // 2 background rings + 2 progress rings = 4 circles
    expect(circles?.length).toBe(4);
  });

  it('handles zero values gracefully', () => {
    render(
      <MyLearningProgress
        lessonsVisited={0}
        totalLessons={0}
        contentsCompleted={0}
        totalContents={0}
      />
    );
    const zeros = screen.getAllByText('0/0');
    expect(zeros).toHaveLength(2);
    expect(screen.getByText('Learning Progress')).toBeInTheDocument();
  });

  // Regression: the Learning Path tab used to reuse the same Course-shaped
  // lesson/content stats (recomputed over LP-typed enrolments instead of
  // courses) - not their own Skills/Learning Path counts (see bug: Skills
  // Count and Learning Path Count not the same as Course).
  describe('typeFilter="learningPath"', () => {
    it('shows Skills gained and Learning Paths completed instead of Lessons/Contents', () => {
      render(
        <MyLearningProgress
          typeFilter="learningPath"
          lessonsVisited={5}
          totalLessons={10}
          contentsCompleted={2}
          totalContents={4}
          skillsGained={3}
          skillsTotal={8}
          pathsCompleted={1}
          pathsTotal={2}
        />
      );

      expect(screen.getByText('3/8')).toBeInTheDocument();
      expect(screen.getByText('Skills gained')).toBeInTheDocument();
      expect(screen.getByText('1/2')).toBeInTheDocument();
      expect(screen.getByText('Learning Paths completed')).toBeInTheDocument();
      expect(screen.queryByText('5/10')).not.toBeInTheDocument();
      expect(screen.queryByText('2/4')).not.toBeInTheDocument();
    });
  });
});
