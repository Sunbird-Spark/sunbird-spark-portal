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

// Mock the useLearnerProgress hook
vi.mock('@/hooks/useLearnerProgress', () => ({
  useLearnerProgress: vi.fn(),
}));

import { useLearnerProgress } from '@/hooks/useLearnerProgress';
const mockUseLearnerProgress = vi.mocked(useLearnerProgress);
type LearnerProgressResult = ReturnType<typeof useLearnerProgress>;

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

const defaultQueryState = {
  isLoading: false,
  isError: false,
  data: mockApiLearners,
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
  promise: Promise.resolve(mockApiLearners),
};

describe('CourseReportContent', () => {
  beforeEach(() => {
    mockUseLearnerProgress.mockReturnValue(defaultQueryState as unknown as LearnerProgressResult);
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

