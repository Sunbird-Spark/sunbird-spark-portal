import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CourseProgressCard from './CourseProgressCard';

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('CourseProgressCard', () => {
  it('renders with course progress heading', () => {
    render(<CourseProgressCard totalContentCount={10} />);
    expect(screen.getByText('courseDetails.courseProgress')).toBeInTheDocument();
    expect(screen.getByTestId('course-progress-card')).toBeInTheDocument();
  });

  it('renders progress percentage from completedContentCount and totalContentCount', () => {
    render(
      <CourseProgressCard totalContentCount={10} completedContentCount={3} />
    );
    expect(screen.getByText('30%')).toBeInTheDocument();
    const progressbar = screen.getByRole('progressbar', { name: 'courseDetails.courseProgress' });
    expect(progressbar).toHaveAttribute('aria-valuenow', '30');
  });

  it('renders 100% when all completed', () => {
    render(
      <CourseProgressCard totalContentCount={5} completedContentCount={5} />
    );
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders 0% when totalContentCount is 0', () => {
    render(<CourseProgressCard totalContentCount={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders batch start date when batchStartDate is provided', () => {
    render(
      <CourseProgressCard
        totalContentCount={5}
        batchStartDate="2025-06-15T00:00:00.000Z"
      />
    );
    expect(screen.getByText(/courseDetails\.batchStartedOn/)).toBeInTheDocument();
    const batchStartedText = screen.getByText(/courseDetails\.batchStartedOn/);
    expect(batchStartedText).toBeInTheDocument();
    expect(batchStartedText?.textContent).toMatch(/\d+/);
    expect(batchStartedText?.textContent).toMatch(/2025/);
  });

  it('does not render batch start date when batchStartDate is not provided', () => {
    render(<CourseProgressCard totalContentCount={5} />);
    expect(screen.queryByText(/courseDetails\.batchStartedOn/)).not.toBeInTheDocument();
  });

  it('computes completed count from contentStatus when completedContentCount not provided', () => {
    const contentStatus = { c1: 2, c2: 2, c3: 1 };
    render(
      <CourseProgressCard
        totalContentCount={5}
        contentStatus={contentStatus}
      />
    );
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('computes completed count from completionPercentage when no contentStatus', () => {
    render(
      <CourseProgressCard
        totalContentCount={10}
        completionPercentage={60}
      />
    );
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('prefers completedContentCount over contentStatus when both provided', () => {
    render(
      <CourseProgressCard
        totalContentCount={10}
        completedContentCount={7}
        contentStatus={{ c1: 2, c2: 2 }}
      />
    );
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('caps progress at 100%', () => {
    render(
      <CourseProgressCard totalContentCount={10} completedContentCount={15} />
    );
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
