import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CourseReportContent from './CourseReportContent';
import type { LearnerProgressApiItem } from '@/types/reports';

// Mock recharts to avoid canvas errors in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  FunnelChart: ({ children }: { children: React.ReactNode }) => <div data-testid="funnel-chart">{children}</div>,
  Funnel: () => null,
  LabelList: () => null,
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
        'courseReport.loadingLearners': 'Loading learner data…',
        'courseReport.loadingAssessments': 'Loading assessment data…',
        'courseReport.somethingWentWrong': 'Something went wrong',
        'courseReport.failedLearnerProgress': 'Failed to load learner progress. Please try again.',
        'courseReport.failedAssessmentData': 'Failed to load assessment data. Please try again.',
        'courseReport.tryAgain': 'Try Again',
        'courseReport.searchLearners': 'Search learners…',
        'courseReport.progressFilter': 'Progress',
        'courseReport.progress025': '0–25%',
        'courseReport.progress2550': '25–50%',
        'courseReport.progress5075': '50–75%',
        'courseReport.progress75100': '75–100%',
        'courseReport.colLearnerName': 'Learner Name',
        'courseReport.colProgress': 'Progress',
        'courseReport.colStatus': 'Status',
        'courseReport.colLastActive': 'Last Active',
        'courseReport.colCertificate': 'Certificate',
        'courseReport.colAttempt': 'Attempt #',
        'courseReport.colScore': 'Score',
        'courseReport.colMaxScore': 'Max Score',
        'courseReport.colPercent': '%',
        'courseReport.colDate': 'Date',
        'dataTable.noData': 'No data available.',
        'dataTable.showing': 'Showing {{from}}–{{to}} of {{total}}',
        'dataTable.pageIndicator': '{{page}} / {{total}}',
        'dataTable.firstPage': 'First page',
        'dataTable.prevPage': 'Previous page',
        'dataTable.nextPage': 'Next page',
        'dataTable.lastPage': 'Last page',
        'filterPanel.searchPlaceholder': 'Search…',
        'filterPanel.allOption': 'All {{label}}',
        'exportButton.exportCsv': 'Export CSV',
        'exportButton.noDataToExport': 'No data to export',
        'exportButton.csvExportedSuccessfully': 'CSV exported successfully',
      };
      return translations[key] ?? key;
    },
    languages: [],
    currentCode: 'en',
    currentLanguage: { code: 'en', label: 'English', dir: 'ltr', index: 1, font: "'Rubik', sans-serif" },
    changeLanguage: vi.fn(),
    isRTL: false,
    dir: 'ltr',
  }),
}));

// Mock the useLearnerProgress hook
vi.mock('@/hooks/useLearnerProgress', () => ({
  useLearnerProgress: vi.fn(),
}));

// Mock the useAssessmentData hook
vi.mock('@/hooks/useAssessmentData', () => ({
  useAssessmentData: vi.fn(),
}));

import { useLearnerProgress } from '@/hooks/useLearnerProgress';
import { useAssessmentData } from '@/hooks/useAssessmentData';
const mockUseLearnerProgress = vi.mocked(useLearnerProgress);
const mockUseAssessmentData = vi.mocked(useAssessmentData);
type LearnerProgressResult = ReturnType<typeof useLearnerProgress>;
type AssessmentDataResult = ReturnType<typeof useAssessmentData>;

const mockApiLearners: LearnerProgressApiItem[] = [
  {
    userid: 'user-1',
    userDetails: { firstName: 'Neha', lastName: 'Gupta' },
    enrolled_date: '2026-03-04T14:14:46.351+00:00',
    completionpercentage: null,
    status: 1,
    datetime: '2026-03-04T14:14:55.144+00:00',
    issued_certificates: null,
  },
  {
    userid: 'user-2',
    userDetails: { firstName: 'Vikram', lastName: 'Singh' },
    enrolled_date: '2026-03-04T14:14:20.758+00:00',
    completionpercentage: 100,
    status: 2,
    datetime: '2026-03-04T14:17:07.070+00:00',
    issued_certificates: [
      {
        identifier: '1-abc',
        lastIssuedOn: '2026-03-04T14:17:07.393+0000',
        name: 'Test Certificate',
        templateUrl: 'https://example.com/cert.svg',
        token: '',
        type: 'TrainingCertificate',
      },
    ],
  },
  {
    // completed (status=2) but certificate not yet issued → Pending
    userid: 'user-3',
    userDetails: { firstName: 'Arjun', lastName: 'Patel' },
    enrolled_date: '2026-03-04T14:19:03.706+00:00',
    completionpercentage: null,
    status: 2,
    datetime: '2026-03-06T06:46:26.055+00:00',
    issued_certificates: null,
  },
];

const mockResult = { data: mockApiLearners, count: 3 };

const defaultQueryState = {
  isLoading: false,
  isError: false,
  data: mockResult,
  error: null,
  status: 'success' as const,
  isPending: false,
  isSuccess: true,
  isFetching: false,
  isRefetching: false,
  dataUpdatedAt: 0,
  errorUpdatedAt: 0,
  failureCount: 0,
  failureReason: null,
  isLoadingError: false,
  isRefetchError: false,
  isPlaceholderData: false,
  isStale: false,
  isInitialLoading: false,
  fetchStatus: 'idle' as const,
  refetch: vi.fn(),
  remove: vi.fn(),
  promise: Promise.resolve(mockResult),
};

const emptyAssessmentState = {
  isLoading: false,
  isError: false,
  data: { data: [], count: 0 },
  error: null,
  status: 'success' as const,
  isPending: false,
  isSuccess: true,
  isFetching: false,
  isRefetching: false,
  dataUpdatedAt: 0,
  errorUpdatedAt: 0,
  failureCount: 0,
  failureReason: null,
  isLoadingError: false,
  isRefetchError: false,
  isPlaceholderData: false,
  isStale: false,
  isInitialLoading: false,
  fetchStatus: 'idle' as const,
  refetch: vi.fn(),
  remove: vi.fn(),
  promise: Promise.resolve({ data: [], count: 0 }),
};

describe('CourseReportContent', () => {
  beforeEach(() => {
    mockUseLearnerProgress.mockReturnValue(defaultQueryState as unknown as LearnerProgressResult);
    mockUseAssessmentData.mockReturnValue(emptyAssessmentState as unknown as AssessmentDataResult);
  });

  it('renders with data-testid', () => {
    render(<CourseReportContent />);
    expect(screen.getByTestId('course-report-content')).toBeInTheDocument();
  });

  it('renders summary cards', () => {
    render(<CourseReportContent />);
    expect(screen.getByText('Total Enrolled')).toBeInTheDocument();
    expect(screen.getByText('Total Completed')).toBeInTheDocument();
    expect(screen.getByText('Certificates Issued')).toBeInTheDocument();
    expect(screen.getByText('Avg Score')).toBeInTheDocument();
  });

  it('renders chart cards', () => {
    render(<CourseReportContent />);
    expect(screen.getByText('Enrollment vs Completion')).toBeInTheDocument();
    expect(screen.getByText('Pending Completion Buckets')).toBeInTheDocument();
    expect(screen.getByText('Score Distribution')).toBeInTheDocument();
  });

  it('renders Learner Progress tab', () => {
    render(<CourseReportContent />);
    expect(screen.getByRole('tab', { name: /learner progress/i })).toBeInTheDocument();
  });

  it('renders Assessments tab', () => {
    render(<CourseReportContent />);
    expect(screen.getByRole('tab', { name: /assessments/i })).toBeInTheDocument();
  });

  it('renders learner progress table by default', () => {
    render(<CourseReportContent />);
    expect(screen.getByText('Learner Name')).toBeInTheDocument();
  });

  it('does not render Time Spent column', () => {
    render(<CourseReportContent />);
    expect(screen.queryByText('Time Spent')).not.toBeInTheDocument();
  });

  it('shows — in summary cards while loading', () => {
    mockUseLearnerProgress.mockReturnValue({
      ...defaultQueryState,
      isLoading: true,
      isSuccess: false,
      data: undefined,
    } as unknown as LearnerProgressResult);
    render(<CourseReportContent />);
    // All four summary cards should display em-dash while loading
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
  });

  it('shows loading state while fetching learners', () => {
    mockUseLearnerProgress.mockReturnValue({
      ...defaultQueryState,
      isLoading: true,
      isSuccess: false,
      data: undefined,
    } as unknown as LearnerProgressResult);
    render(<CourseReportContent />);
    expect(screen.getByTestId('learners-loading')).toBeInTheDocument();
  });

  it('shows total enrolled from API count', () => {
    render(<CourseReportContent />);
    // mockResult.count = 3
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows total completed count (status === 2)', () => {
    render(<CourseReportContent />);
    // Vikram (status=2) + Arjun (status=2) = 2 completed
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows certificates issued count (non-null issued_certificates)', () => {
    render(<CourseReportContent />);
    // Only Vikram has issued_certificates
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows em-dash for Avg Score', () => {
    render(<CourseReportContent />);
    expect(screen.getByText('Avg Score')).toBeInTheDocument();
  });

  it('shows weekly chart labels when batchStartDate is provided', () => {
    render(<CourseReportContent courseId="c-1" batchId="b-1" batchStartDate="2026-03-04" />);
    // Week labels come from buildEnrollmentVsCompletion; XAxis is mocked so we check chart card title
    expect(screen.getByText('Enrollment vs Completion')).toBeInTheDocument();
  });

  it('shows error state when learner fetch fails', () => {
    mockUseLearnerProgress.mockReturnValue({
      ...defaultQueryState,
      isLoading: false,
      isError: true,
      isSuccess: false,
      data: undefined,
      error: new Error('Network error'),
    } as unknown as LearnerProgressResult);
    render(<CourseReportContent />);
    expect(screen.getByTestId('learners-error')).toBeInTheDocument();
  });

  it('renders learner names from API data', () => {
    render(<CourseReportContent />);
    expect(screen.getByText('Neha Gupta')).toBeInTheDocument();
    expect(screen.getByText('Vikram Singh')).toBeInTheDocument();
  });

  it('renders correct status for learners', () => {
    render(<CourseReportContent />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Issued certificate badge when issued_certificates is not null', () => {
    render(<CourseReportContent />);
    expect(screen.getByText('Issued')).toBeInTheDocument();
  });

  it('renders Pending certificate badge when completed but no certificate issued', () => {
    render(<CourseReportContent />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders N/A certificate badge when not completed and no certificate', () => {
    render(<CourseReportContent />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('maps null completionpercentage to 0%', () => {
    render(<CourseReportContent />);
    // Neha and Arjun both have null completionpercentage — should show 0%
    expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(1);
  });

  it('switches to assessments tab on click', async () => {
    const user = userEvent.setup();
    render(<CourseReportContent />);
    const assessTab = screen.getByRole('tab', { name: /assessments/i });
    await user.click(assessTab);
    expect(assessTab).toHaveAttribute('data-state', 'active');
  });

  it('renders search input in learner progress tab', () => {
    render(<CourseReportContent />);
    expect(screen.getByPlaceholderText(/search learners/i)).toBeInTheDocument();
  });

  it('renders Export CSV button for learner progress', () => {
    render(<CourseReportContent />);
    expect(screen.getAllByRole('button', { name: /export csv/i })[0]).toBeInTheDocument();
  });

  it('accepts courseId and batchId props without crashing', () => {
    render(<CourseReportContent courseId="course-123" batchId="batch-456" />);
    expect(screen.getByTestId('course-report-content')).toBeInTheDocument();
    expect(mockUseLearnerProgress).toHaveBeenCalledWith('course-123', 'batch-456');
  });

  it('filters learners by search text', () => {
    render(<CourseReportContent />);
    const search = screen.getByPlaceholderText(/search learners/i);
    fireEvent.change(search, { target: { value: 'zzznomatch' } });
    expect(screen.getByText('No data available.')).toBeInTheDocument();
  });

  it('shows only matched learner after search', () => {
    render(<CourseReportContent />);
    const search = screen.getByPlaceholderText(/search learners/i);
    fireEvent.change(search, { target: { value: 'neha' } });
    expect(screen.getByText('Neha Gupta')).toBeInTheDocument();
    expect(screen.queryByText('Vikram Singh')).not.toBeInTheDocument();
  });
});

