import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CourseReport from './CourseReport';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  FunnelChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Funnel: () => null,
  LabelList: () => null,
}));

vi.mock('@/components/reports/ReportLayout', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'courseReport.totalEnrolled': 'Total Enrolled',
        'courseReport.totalCompleted': 'Total Completed',
        'courseReport.certificatesIssued': 'Certificates Issued',
        'courseReport.avgScore': 'Avg Score',
        'courseReport.enrollmentVsCompletion': 'Enrollment vs Completion',
        'courseReport.pendingCompletionBuckets': 'Pending Completion Buckets',
        'courseReport.scoreDistribution': 'Score Distribution',
        'courseReport.enrolled': 'Enrolled',
        'courseReport.completed': 'Completed',
        'courseReport.learners': 'Learners',
        'courseReport.learnerProgress': 'Learner Progress',
        'courseReport.assessments': 'Assessments',
        'courseReport.detailedLearnerProgress': 'Detailed Learner Progress',
        'courseReport.detailedAssessments': 'Detailed Assessments',
      };
      return translations[key] ?? key;
    },
  }),
}));

// Avoid needing QueryClientProvider — learner data is tested in CourseReportContent.test.tsx
vi.mock('@/hooks/useLearnerProgress', () => ({
  useLearnerProgress: () => ({ data: { data: [], count: 0 }, isLoading: false, isError: false, refetch: vi.fn() }),
}));

vi.mock('@/hooks/useAssessmentData', () => ({
  useAssessmentData: () => ({ data: { data: [] }, isLoading: false, isError: false, refetch: vi.fn() }),
}));

const renderWithRoute = (courseId = 'course-1') =>
  render(
    <MemoryRouter initialEntries={[`/reports/course/${courseId}`]}>
      <Routes>
        <Route path="/reports/course/:courseId" element={<CourseReport />} />
      </Routes>
    </MemoryRouter>
  );

vi.mock('@/hooks/useImpression', () => ({
  default: vi.fn(),
}));

describe('CourseReport', () => {
  it('renders without crashing', () => {
    renderWithRoute();
    expect(screen.getByTestId('course-report-content')).toBeInTheDocument();
  });

  it('renders course name as page title', () => {
    renderWithRoute();
    // courseReportSummary.courseName from mock data
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders summary cards', () => {
    renderWithRoute();
    expect(screen.getByText('Total Enrolled')).toBeInTheDocument();
    expect(screen.getByText('Total Completed')).toBeInTheDocument();
  });

  it('renders learner progress tab', () => {
    renderWithRoute();
    expect(screen.getByRole('tab', { name: /learner progress/i })).toBeInTheDocument();
  });

  it('uses empty string when courseId is undefined (line 9 || branch)', async () => {
    const { default: useImpression } = await import('@/hooks/useImpression');
    render(
      <MemoryRouter initialEntries={['/reports/course']}>
        <Routes>
          <Route path="/reports/course" element={<CourseReport />} />
        </Routes>
      </MemoryRouter>
    );
    // useImpression should be called with id: '' when courseId is undefined
    expect(useImpression).toHaveBeenCalledWith(
      expect.objectContaining({ object: expect.objectContaining({ id: '' }) })
    );
  });
});
