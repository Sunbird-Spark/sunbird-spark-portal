import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { useParams } from 'react-router-dom';
import CourseDashboardPage from './CourseDashboardPage';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: vi.fn(() => ({ collectionId: 'col_123', tab: 'batches' })),
  Link: ({ children, to }: { children: React.ReactNode, to: string }) => <a href={to}>{children}</a>,
}));

// Mock hooks and components
vi.mock('@/hooks/useCollection', () => ({
  useCollection: vi.fn(() => ({
    data: { title: 'Test Course Name' },
    isLoading: false,
    isError: false,
  })),
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
  default: () => <div data-testid="certificates-tab-mock" />,
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
});
