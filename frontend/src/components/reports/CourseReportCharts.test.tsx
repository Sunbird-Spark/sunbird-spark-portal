import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CourseReportCharts from './CourseReportCharts';

// Make Tooltip call formatter(5) immediately on render so the inline arrow functions get covered
vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ children }: any) => <div>{children}</div>,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: ({ formatter }: any) => {
    const result = formatter ? formatter(5) : null;
    return result ? <div data-testid="tooltip-result">{JSON.stringify(result)}</div> : null;
  },
  Legend: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  Cell: () => null,
  LabelList: () => null,
}));

vi.mock('@/components/reports/ChartCard', () => ({
  default: ({ title, children }: any) => (
    <div data-testid="chart-card">
      <span data-testid="chart-title">{title}</span>
      {children}
    </div>
  ),
}));

const defaultProps = {
  enrollmentChartData: [{ label: 'Jan', enrolled: 10, completed: 5 }],
  progressBucketsData: [{ bucket: '0-25%', count: 3 }],
  scoreDistributionData: [{ bucket: '0-25', count: 2 }],
  labels: {
    enrollmentVsCompletion: 'Enrollment vs Completion',
    pendingCompletionBuckets: 'Pending Completion',
    scoreDistribution: 'Score Distribution',
    enrolled: 'Enrolled',
    completed: 'Completed',
    learners: 'Learners',
  },
};

describe('CourseReportCharts', () => {
  it('renders three chart cards with correct titles', () => {
    render(<CourseReportCharts {...defaultProps} />);
    const titles = screen.getAllByTestId('chart-title').map(el => el.textContent);
    expect(titles).toContain('Enrollment vs Completion');
    expect(titles).toContain('Pending Completion');
    expect(titles).toContain('Score Distribution');
  });

  it('pendingCompletionBuckets Tooltip formatter returns "N learners" (line 54)', () => {
    render(<CourseReportCharts {...defaultProps} />);
    // The mock calls formatter(5) and renders the result; two Tooltips exist
    const tooltips = screen.getAllByTestId('tooltip-result');
    expect(tooltips.length).toBeGreaterThanOrEqual(1);
    // formatter for pendingCompletionBuckets: (value) => [`${value} learners`]
    expect(tooltips[0]!.textContent).toContain('5 learners');
  });

  it('scoreDistribution Tooltip formatter returns ["N learners", label] (line 73)', () => {
    render(<CourseReportCharts {...defaultProps} />);
    const tooltips = screen.getAllByTestId('tooltip-result');
    // scoreDistribution formatter: (value) => [`${value} learners`, labels.learners]
    const scoreTooltip = tooltips[1]!;
    expect(scoreTooltip.textContent).toContain('5 learners');
    expect(scoreTooltip.textContent).toContain('Learners');
  });

  it('renders with empty chart data arrays', () => {
    render(
      <CourseReportCharts
        {...defaultProps}
        enrollmentChartData={[]}
        progressBucketsData={[]}
        scoreDistributionData={[]}
      />
    );
    expect(screen.getAllByTestId('chart-card')).toHaveLength(3);
  });
});
