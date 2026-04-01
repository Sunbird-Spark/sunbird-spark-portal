import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { useParams } from 'react-router-dom';
import CourseDashboardPage from './CourseDashboardPage';
import { useCollection } from '@/hooks/useCollection';
import { useCurrentUserId, useIsMentor } from '@/hooks/useUser';
import { useBatchListForMentor } from '@/hooks/useBatch';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: vi.fn(() => ({ pathname: '/collection/col_123/dashboard/batches' })),
  useParams: vi.fn(() => ({ collectionId: 'col_123', tab: 'batches' })),
  Link: ({ children, to }: { children: React.ReactNode, to: string }) => <a href={to}>{children}</a>,
}));

vi.mock('@/hooks/useAppI18n', () => ({
  useAppI18n: () => ({
    t: (k: string) => {
      const map: Record<string, string> = {
        'courseDashboard.title': 'Course Dashboard',
        'courseDashboard.backToCoursePage': 'Back to Course Page',
        'courseDashboard.checkingPermissions': 'Checking permissions\u2026',
        'courseDashboard.failedToLoad': 'Failed to load course.',
        'courseDashboard.manageDashboard': 'Manage dashboard for this course',
        'tabs.batches': 'Batches',
        'tabs.reissueCertificate': 'Reissue Certificate',
      };
      return map[k] ?? k;
    },
    isRTL: false,
    dir: 'ltr',
    currentCode: 'en',
  }),
}));

// Mock hooks and components
vi.mock('@/hooks/useCollection', () => ({
  useCollection: vi.fn(() => ({
    data: { title: 'Test Course Name', createdBy: 'user-abc' },
    isLoading: false,
    isError: false,
  })),
}));

vi.mock('@/hooks/useBatch', () => ({
  useBatchListForCreator: vi.fn(() => ({ data: [], isLoading: false, isError: false })),
  useBatchListForMentor: vi.fn(() => ({ data: [], isLoading: false, isError: false })),
  mergeBatches: vi.fn(() => []),
}));

vi.mock('@/hooks/useUser', () => ({
  useCurrentUserId: vi.fn(() => ({ data: 'user-abc' })),
  useIsMentor: vi.fn(() => false),
}));

vi.mock('@/components/home/Header', () => ({
  default: () => <div data-testid="app-header" />,
}));
vi.mock('@/components/home/Footer', () => ({
  default: () => <div data-testid="app-footer" />,
}));

vi.mock('./BatchesTab', () => ({
  default: () => <div data-testid="batches-tab-mock" />,
}));
vi.mock('./CertificatesTab', () => ({
  default: ({ canReissue }: { canReissue: boolean }) => (
    <div data-testid="certificates-tab-mock" data-can-reissue={String(canReissue)} />
  ),
}));

describe('CourseDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header, title, and tabs', () => {
    render(<CourseDashboardPage />);

    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-title')).toHaveTextContent('Test Course Name');
    expect(screen.getByTestId('tab-batches')).toBeInTheDocument();
    expect(screen.getByTestId('tab-certificates')).toBeInTheDocument();
    expect(screen.getByTestId('back-to-course-btn')).toBeInTheDocument();
  });

  it('renders BatchesTab by default', () => {
    render(<CourseDashboardPage />);
    expect(screen.getByTestId('batches-tab-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('certificates-tab-mock')).not.toBeInTheDocument();
  });

  it('navigates back to course page on back button click', () => {
    render(<CourseDashboardPage />);
    fireEvent.click(screen.getByTestId('back-to-course-btn'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates to specific tab when clicked', () => {
    render(<CourseDashboardPage />);
    fireEvent.click(screen.getByTestId('tab-certificates'));
    expect(mockNavigate).toHaveBeenCalledWith('/collection/col_123/dashboard/certificates');
  });

  it('redirects to batches if an invalid tab is provided', () => {
    (useParams as Mock).mockReturnValue({ collectionId: 'col_123', tab: 'invalid' });

    render(<CourseDashboardPage />);
    expect(mockNavigate).toHaveBeenCalledWith('/collection/col_123/dashboard/batches', { replace: true });
  });

  it('renders CertificatesTab when tab is certificates', () => {
    (useParams as Mock).mockReturnValue({ collectionId: 'col_123', tab: 'certificates' });

    render(<CourseDashboardPage />);
    expect(screen.getByTestId('certificates-tab-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('batches-tab-mock')).not.toBeInTheDocument();
  });

  it('passes canReissue=true to CertificatesTab when uid matches createdBy', () => {
    (useParams as Mock).mockReturnValue({ collectionId: 'col_123', tab: 'certificates' });
    (useCollection as Mock).mockReturnValue({
      data: { title: 'Test Course', createdBy: 'user-abc' },
      isLoading: false,
      isError: false,
    });
    (useCurrentUserId as Mock).mockReturnValue({ data: 'user-abc' });

    render(<CourseDashboardPage />);
    expect(screen.getByTestId('certificates-tab-mock')).toHaveAttribute('data-can-reissue', 'true');
  });

  it('passes canReissue=false to CertificatesTab when uid does not match createdBy and is not mentor', () => {
    (useParams as Mock).mockReturnValue({ collectionId: 'col_123', tab: 'certificates' });
    (useCollection as Mock).mockReturnValue({
      data: { title: 'Test Course', createdBy: 'user-abc' },
      isLoading: false,
      isError: false,
    });
    (useCurrentUserId as Mock).mockReturnValue({ data: 'user-xyz' });

    render(<CourseDashboardPage />);
    expect(screen.getByTestId('certificates-tab-mock')).toHaveAttribute('data-can-reissue', 'false');
  });

  it('passes canReissue=false to CertificatesTab when uid is not yet loaded', () => {
    (useParams as Mock).mockReturnValue({ collectionId: 'col_123', tab: 'certificates' });
    (useCurrentUserId as Mock).mockReturnValue({ data: undefined });

    render(<CourseDashboardPage />);
    expect(screen.getByTestId('certificates-tab-mock')).toHaveAttribute('data-can-reissue', 'false');
  });

  it('redirects to course page if user is not authorized after data has loaded', () => {
    (useParams as Mock).mockReturnValue({ collectionId: 'col_123' });
    (useCollection as Mock).mockReturnValue({
      data: { title: 'Test Course', createdBy: 'owner-id' },
      isLoading: false,
      isError: false,
    });
    (useCurrentUserId as Mock).mockReturnValue({ data: 'stranger-id' });
    (vi.mocked(useBatchListForMentor) as Mock).mockReturnValue({ data: [], isLoading: false });

    render(<CourseDashboardPage />);
    
    expect(mockNavigate).toHaveBeenCalledWith('/collection/col_123', { replace: true });
  });

  it('shows permissions loading state while checking mentor batches', () => {
    (useParams as Mock).mockReturnValue({ collectionId: 'col_123' });
    (useCollection as Mock).mockReturnValue({
      data: { title: 'Test Course', createdBy: 'owner-id' },
      isLoading: false,
      isError: false,
    });
    (useCurrentUserId as Mock).mockReturnValue({ data: 'stranger-id' });
    (vi.mocked(useBatchListForMentor) as Mock).mockReturnValue({ data: undefined, isLoading: true });

    render(<CourseDashboardPage />);
    
    expect(screen.getByTestId('page-loader-message')).toHaveTextContent('Checking permissions…');
  });
});
