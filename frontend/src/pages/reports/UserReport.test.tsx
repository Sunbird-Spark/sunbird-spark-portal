import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import UserReport from './UserReport';
import type { UserCourseEnrolmentApiItem } from '@/types/reports';

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
        'userReport.title': 'User Report',
        'userReport.courseProgress': 'Course Progress',
        'userReport.certificates': 'Certificates',
        'userReport.assessmentHistory': 'Assessment History',
        'userReport.totalCourses': 'Total Courses',
        'userReport.coursesCompleted': 'Courses Completed',
        'userReport.coursesPending': 'Courses Pending',
        'userReport.certificatesIssued': 'Certificates Issued',
        'userReport.assessmentsCompleted': 'Assessments Done',
        'userReport.course': 'Course',
        'userReport.progress': 'Progress',
        'userReport.status': 'Status',
        'userReport.enrolled': 'Enrolled',
        'userReport.lastAccessed': 'Last Accessed',
        'userReport.certificateId': 'Certificate ID',
        'userReport.issuedDate': 'Issued Date',
        'userReport.assessment': 'Assessment',
        'userReport.score': 'Score',
        'userReport.max': 'Max',
        'userReport.result': 'Result',
        'userReport.date': 'Date',
        'home': 'Home',
      };
      return translations[key] ?? key;
    },
  }),
}));

vi.mock('@/hooks/useUserCourseEnrolments', () => ({
  useUserCourseEnrolments: vi.fn(),
}));

vi.mock('@/hooks/useUserRead', () => ({
  useUserRead: vi.fn(),
}));

import { useUserCourseEnrolments } from '@/hooks/useUserCourseEnrolments';
import { useUserRead } from '@/hooks/useUserRead';
const mockUseUserCourseEnrolments = vi.mocked(useUserCourseEnrolments);
const mockUseUserRead = vi.mocked(useUserRead);

type EnrolmentQueryResult = ReturnType<typeof useUserCourseEnrolments>;

const mockApiCourses: UserCourseEnrolmentApiItem[] = [
  {
    courseid: 'do_1',
    collectionDetails: { name: 'Information Technology', identifier: 'do_1', contentType: 'Course' },
    completionpercentage: null,
    status: 2,
    enrolled_date: '2026-03-04T14:14:32.463+00:00',
    datetime: '2026-03-04T14:22:48.576+00:00',
    issued_certificates: [
      { identifier: 'cert-1', lastIssuedOn: '2026-03-05T00:00:00.000+00:00', name: 'IT Cert', templateUrl: '', token: '', type: 'TrainingCertificate' },
    ],
  },
  {
    courseid: 'do_2',
    collectionDetails: { name: 'Data Science and AI', identifier: 'do_2', contentType: 'Course' },
    completionpercentage: 100,
    status: 2,
    enrolled_date: '2026-03-04T14:12:07.814+00:00',
    datetime: '2026-03-11T11:40:38.362+00:00',
    issued_certificates: null,
  },
  {
    courseid: 'do_3',
    collectionDetails: { name: 'Business and Management', identifier: 'do_3', contentType: 'Course' },
    completionpercentage: null,
    status: 1,
    enrolled_date: '2026-03-04T14:11:51.470+00:00',
    datetime: '2026-03-10T07:13:21.480+00:00',
    issued_certificates: null,
  },
];

const defaultEnrolmentState = {
  isLoading: false,
  isError: false,
  data: { data: mockApiCourses, count: 3 },
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
  promise: Promise.resolve({ data: mockApiCourses, count: 3 }),
};

const defaultUserReadState = {
  isLoading: false,
  isError: false,
  data: { data: { response: { firstName: 'Aarav', lastName: 'Mehta' } } },
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
  promise: Promise.resolve({ data: { response: { firstName: 'Aarav', lastName: 'Mehta' } } }),
};

const renderWithRoute = (userId = 'me') =>
  render(
    <MemoryRouter initialEntries={[`/reports/user/${userId}`]}>
      <Routes>
        <Route path="/reports/user/:userId" element={<UserReport />} />
      </Routes>
    </MemoryRouter>
  );

describe('UserReport', () => {
  beforeEach(() => {
    mockUseUserCourseEnrolments.mockReturnValue(defaultEnrolmentState as unknown as EnrolmentQueryResult);
    mockUseUserRead.mockReturnValue(defaultUserReadState as unknown as ReturnType<typeof useUserRead>);
  });

  it('renders without crashing', () => {
    renderWithRoute();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders user name in title from useUserRead', () => {
    renderWithRoute();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('User Report:');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Aarav Mehta');
  });

  it('renders summary cards', () => {
    renderWithRoute();
    expect(screen.getByText('Total Courses')).toBeInTheDocument();
    expect(screen.getByText('Courses Completed')).toBeInTheDocument();
    expect(screen.getByText('Courses Pending')).toBeInTheDocument();
    expect(screen.getByText('Certificates Issued')).toBeInTheDocument();
    expect(screen.getByText('Assessments Done')).toBeInTheDocument();
  });

  it('shows total courses count from API count field', () => {
    renderWithRoute();
    // defaultEnrolmentState has count: 3
    expect(screen.getByText('Total Courses').parentElement?.textContent).toContain('3');
  });

  it('shows completed count from API (status === 2)', () => {
    renderWithRoute();
    // do_1 + do_2 have status=2, do_3 has status=1 → completed=2, pending=1
    expect(screen.getByText('Courses Completed').parentElement?.textContent).toContain('2');
  });

  it('shows pending count from API (status !== 2)', () => {
    renderWithRoute();
    expect(screen.getByText('Courses Pending').parentElement?.textContent).toContain('1');
  });

  it('shows certificates issued count from API (non-null issued_certificates)', () => {
    renderWithRoute();
    // Only do_1 has issued_certificates → count = 1
    expect(screen.getByText('Certificates Issued').parentElement?.textContent).toContain('1');
  });

  it('shows — for summary cards while loading', () => {
    mockUseUserCourseEnrolments.mockReturnValue({
      ...defaultEnrolmentState,
      isLoading: true,
      isSuccess: false,
      data: undefined,
    } as unknown as EnrolmentQueryResult);
    renderWithRoute();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('shows loading state for course progress while fetching', () => {
    mockUseUserCourseEnrolments.mockReturnValue({
      ...defaultEnrolmentState,
      isLoading: true,
      isSuccess: false,
      data: undefined,
    } as unknown as EnrolmentQueryResult);
    renderWithRoute();
    expect(screen.getByTestId('course-progress-loading')).toBeInTheDocument();
  });

  it('shows error state when course progress fetch fails', () => {
    mockUseUserCourseEnrolments.mockReturnValue({
      ...defaultEnrolmentState,
      isLoading: false,
      isError: true,
      isSuccess: false,
      data: undefined,
      error: new Error('Network error'),
    } as unknown as EnrolmentQueryResult);
    renderWithRoute();
    expect(screen.getByTestId('course-progress-error')).toBeInTheDocument();
  });

  it('renders Course Progress section', () => {
    renderWithRoute();
    expect(screen.getByRole('region', { name: /course progress/i })).toBeInTheDocument();
  });

  it('renders Certificates section', () => {
    renderWithRoute();
    expect(screen.getByRole('region', { name: /certificates/i })).toBeInTheDocument();
  });

  it('renders Assessment History section', () => {
    renderWithRoute();
    expect(screen.getByRole('region', { name: /assessment history/i })).toBeInTheDocument();
  });

  it('renders course names from API data', () => {
    renderWithRoute();
    expect(screen.getByText('Information Technology')).toBeInTheDocument();
    expect(screen.getByText('Data Science and AI')).toBeInTheDocument();
    expect(screen.getByText('Business and Management')).toBeInTheDocument();
  });

  it('renders correct status badges from API data', () => {
    renderWithRoute();
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('maps null completionpercentage to 0%', () => {
    renderWithRoute();
    expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(1);
  });

  it('shows enrollment date (date only) from API', () => {
    renderWithRoute();
    expect(screen.getAllByText('2026-03-04').length).toBeGreaterThanOrEqual(1);
  });

  it('renders course progress table columns', () => {
    renderWithRoute();
    expect(screen.getAllByText('Course').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Progress').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Status').length).toBeGreaterThan(0);
  });

  it('renders export buttons', () => {
    renderWithRoute();
    const exportBtns = screen.getAllByRole('button', { name: /export csv/i });
    expect(exportBtns.length).toBeGreaterThanOrEqual(1);
  });
});
