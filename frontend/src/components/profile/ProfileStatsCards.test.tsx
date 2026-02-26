import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileStatsCards from './ProfileStatsCards';

// Mock useUserEnrolledCollections
const mockUseUserEnrolledCollections = vi.fn();
vi.mock('@/hooks/useUserEnrolledCollections', () => ({
    useUserEnrolledCollections: () => mockUseUserEnrolledCollections(),
}));

// Mock useUserCertificates
const mockUseUserCertificates = vi.fn();
vi.mock('@/hooks/useCertificate', () => ({
    useUserCertificates: () => mockUseUserCertificates(),
}));

// Mock profile icons
vi.mock('./ProfileIcons', () => ({
    TotalContentsIcon: () => <svg data-testid="icon-total" />,
    InProgressIcon: () => <svg data-testid="icon-progress" />,
    ContentsCompletedIcon: () => <svg data-testid="icon-completed" />,
    CertificationsIcon: () => <svg data-testid="icon-certs" />,
}));

const mockCourses = [
    { courseId: 'course-1', status: 1 }, // in progress
    { courseId: 'course-2', status: 2 }, // completed
    { courseId: 'course-3', status: 2 }, // completed
];

// Expected: totalCourses=3, inProgress=1, completed=2

describe('ProfileStatsCards', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseUserEnrolledCollections.mockReturnValue({
            data: { data: { courses: mockCourses } },
            isLoading: false,
        });
        mockUseUserCertificates.mockReturnValue({
            data: { data: [{ id: 'cert-1' }, { id: 'cert-2' }] },
            isLoading: false,
        });
    });

    it('renders all four stats cards with correct labels and values', () => {
        render(<ProfileStatsCards />);

        // Total Courses: 3 courses enrolled
        const totalCard = screen.getByText('Total Courses').closest('.stat-card');
        expect(totalCard).toBeInTheDocument();
        expect(totalCard!.querySelector('.stat-value')!.textContent).toBe('03');

        // Courses in Progress: status === 1 => 1
        const progressCard = screen.getByText('In Progress').closest('.stat-card');
        expect(progressCard).toBeInTheDocument();
        expect(progressCard!.querySelector('.stat-value')!.textContent).toBe('01');

        // Courses Completed: status === 2 => 2
        const completedCard = screen.getByText('Completed').closest('.stat-card');
        expect(completedCard).toBeInTheDocument();
        expect(completedCard!.querySelector('.stat-value')!.textContent).toBe('02');

        // Certifications Earned: 2 certificates
        const certsCard = screen.getByText('Certifications Earned').closest('.stat-card');
        expect(certsCard).toBeInTheDocument();
        expect(certsCard!.querySelector('.stat-value')!.textContent).toBe('02');
    });

    it('applies correct CSS classes to each card', () => {
        render(<ProfileStatsCards />);

        const totalCard = screen.getByText('Total Courses').closest('.stat-card');
        expect(totalCard).toHaveClass('stat-card-time-spent');

        const progressCard = screen.getByText('In Progress').closest('.stat-card');
        expect(progressCard).toHaveClass('stat-card-badges');

        const completedCard = screen.getByText('Completed').closest('.stat-card');
        expect(completedCard).toHaveClass('stat-card-completed');

        const certsCard = screen.getByText('Certifications Earned').closest('.stat-card');
        expect(certsCard).toHaveClass('stat-card-certs');
    });

    it('renders icons for each card', () => {
        render(<ProfileStatsCards />);

        expect(screen.getByTestId('icon-total')).toBeInTheDocument();
        expect(screen.getByTestId('icon-progress')).toBeInTheDocument();
        expect(screen.getByTestId('icon-completed')).toBeInTheDocument();
        expect(screen.getByTestId('icon-certs')).toBeInTheDocument();
    });

    it('handles empty courses data', () => {
        mockUseUserEnrolledCollections.mockReturnValue({
            data: { data: { courses: [] } },
            isLoading: false,
        });
        mockUseUserCertificates.mockReturnValue({
            data: { data: [] },
            isLoading: false,
        });

        render(<ProfileStatsCards />);

        expect(screen.getByText('Total Courses')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Certifications Earned')).toBeInTheDocument();

        // All values should be "0" (not padded when zero)
        const zeroValues = screen.getAllByText('0');
        expect(zeroValues.length).toBe(4);
    });

    it('handles undefined/null data gracefully', () => {
        mockUseUserEnrolledCollections.mockReturnValue({
            data: undefined,
            isLoading: false,
        });
        mockUseUserCertificates.mockReturnValue({
            data: undefined,
            isLoading: false,
        });

        render(<ProfileStatsCards />);

        const zeroValues = screen.getAllByText('0');
        expect(zeroValues.length).toBe(4);
    });

    it('shows loading state while data is being fetched', () => {
        mockUseUserEnrolledCollections.mockReturnValue({
            data: undefined,
            isLoading: true,
        });
        mockUseUserCertificates.mockReturnValue({
            data: undefined,
            isLoading: true,
        });

        render(<ProfileStatsCards />);

        // Should show loading placeholders
        const loadingValues = screen.getAllByText('--');
        expect(loadingValues.length).toBe(4);

        // Cards should have pulse animation
        const cards = document.querySelectorAll('.stat-card');
        cards.forEach(card => {
            expect(card).toHaveClass('animate-pulse');
        });
    });
});
