import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlatformReports from './PlatformReports';
import type { AdminCourseSummary } from '@/types/reports';

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
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => null,
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
      const map: Record<string, string> = {
        'platformReport.title': 'Platform Reports',
        'platformReport.contentOverview': 'Content Overview',
        'platformReport.contentByStatus': 'Content by Status',
        'platformReport.contentByType': 'Content by Type',
        'platformReport.top5Creators': 'Top 5 Creators',
        'platformReport.mostPopularContent': 'Most Popular Content',
        'platformReport.userAnalytics': 'User Analytics',
        'platformReport.totalUsers': 'Total Users',
        'platformReport.userGrowthTrend': 'User Growth Trend',
        'platformReport.users': 'Users',
        'platformReport.adminCourseSummary': 'Admin Course Summary',
        'platformReport.colCourseName': 'Course Name',
        'platformReport.colEnrolled': 'Enrolled',
        'platformReport.colCompleted': 'Completed',
        'platformReport.colCompletionPct': 'Completion %',
        'platformReport.colCertificates': 'Certificates',
        'platformReport.failedUserGrowth': 'Failed to load user growth data. Please try again later.',
        'platformReport.failedCourseSummary': 'Failed to load course summary. Please try again later.',
        'platformReport.searchCourses': 'Search courses…',
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
      return map[key] ?? key;
    },
    languages: [],
    currentCode: 'en',
    currentLanguage: { code: 'en', label: 'English', dir: 'ltr', index: 1, font: "'Rubik', sans-serif" },
    changeLanguage: vi.fn(),
    isRTL: false,
    dir: 'ltr',
  }),
}));

const MOCK_COURSES: AdminCourseSummary[] = [
  {
    id: 'do_1',
    courseName: 'Introduction to AI',
    totalEnrolled: 10,
    totalCompleted: 5,
    completionPercent: 50,
    certificatesIssued: 3,
    lastUpdated: '',
  },
];

const { mockUseOrgCourseSummary, mockUseContentStatusSummary, mockUseUserCreationCount } = vi.hoisted(() => ({
  mockUseOrgCourseSummary: vi.fn(),
  mockUseContentStatusSummary: vi.fn(),
  mockUseUserCreationCount: vi.fn(),
}));

vi.mock('@/hooks/useOrgCourseSummary', () => ({
  useOrgCourseSummary: mockUseOrgCourseSummary,
}));

vi.mock('@/hooks/useContentStatusSummary', () => ({
  useContentStatusSummary: mockUseContentStatusSummary,
}));

vi.mock('@/hooks/useUserCreationCount', () => ({
  useUserCreationCount: mockUseUserCreationCount,
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <PlatformReports />
    </MemoryRouter>
  );

describe('PlatformReports', () => {
  beforeEach(() => {
    mockUseOrgCourseSummary.mockReturnValue({ data: MOCK_COURSES, isLoading: false, isError: false });
    mockUseContentStatusSummary.mockReturnValue({
      statusData: [{ status: 'Live', count: 155 }, { status: 'Draft', count: 274 }],
      topCreatorsData: [{ name: 'Test Creator', count: 84 }],
      categoryData: [{ group: 'Course', count: 245 }],
      isLoading: false,
      isError: false,
    });
    mockUseUserCreationCount.mockReturnValue({
      data: [{ month: '2026-02', userCount: 56 }, { month: '2026-03', userCount: 126 }],
      totalUsers: 182,
      isLoading: false,
      isError: false,
    });
  });

  it('renders page title', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Platform Reports' })).toBeInTheDocument();
  });

  it('renders Content Overview section', () => {
    renderPage();
    expect(screen.getByRole('region', { name: /content overview/i })).toBeInTheDocument();
  });

  it('renders User Analytics section', () => {
    renderPage();
    expect(screen.getByRole('region', { name: /user analytics/i })).toBeInTheDocument();
  });

  it('renders Admin Course Summary section', () => {
    renderPage();
    expect(screen.getByRole('region', { name: /admin course summary/i })).toBeInTheDocument();
  });

  it('renders Content by Status chart card', () => {
    renderPage();
    expect(screen.getByText('Content by Status')).toBeInTheDocument();
  });

  it('renders User Growth Trend chart card', () => {
    renderPage();
    expect(screen.getByText('User Growth Trend')).toBeInTheDocument();
  });

  it('renders Total Users summary card', () => {
    renderPage();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
  });

  it('renders course search filter', () => {
    renderPage();
    expect(screen.getByPlaceholderText(/search courses/i)).toBeInTheDocument();
  });

  it('renders Admin Course Summary table headers', () => {
    renderPage();
    expect(screen.getByText('Course Name')).toBeInTheDocument();
    expect(screen.getByText('Enrolled')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders export button for course summary', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
  });

  it('filters courses by search text', () => {
    renderPage();
    const search = screen.getByPlaceholderText(/search courses/i);
    fireEvent.change(search, { target: { value: 'zzznomatch' } });
    expect(screen.getByText('No data available.')).toBeInTheDocument();
  });

  it('renders content by type chart', () => {
    renderPage();
    expect(screen.getByText('Content by Type')).toBeInTheDocument();
  });

  it('renders course rows from hook data', () => {
    renderPage();
    expect(screen.getByText('Introduction to AI')).toBeInTheDocument();
  });

  it('shows loading skeleton when courses are loading', () => {
    mockUseOrgCourseSummary.mockReturnValueOnce({ data: [], isLoading: true, isError: false });
    renderPage();
    // DataTableWrapper renders Skeleton rows when loading=true; course rows should be absent
    expect(screen.queryByText('Introduction to AI')).not.toBeInTheDocument();
  });

  it('shows error message when course summary fails', () => {
    mockUseOrgCourseSummary.mockReturnValueOnce({ data: [], isLoading: false, isError: true });
    renderPage();
    expect(screen.getByText(/failed to load course summary/i)).toBeInTheDocument();
  });
});
