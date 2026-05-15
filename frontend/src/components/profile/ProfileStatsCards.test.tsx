import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileStatsCards from './ProfileStatsCards';

// Mock useAppI18n
vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({
        t: (key: string) => ({
            'statsCards.totalCourses': 'Total Courses',
            'statsCards.inProgress': 'In Progress',
            'statsCards.completed': 'Completed',
            'statsCards.certificationsEarned': 'Certifications Earned',
        }[key] ?? key),
        languages: [],
        currentCode: 'en',
        currentLanguage: { code: 'en', label: 'English', dir: 'ltr', index: 1, font: "'Rubik', sans-serif" },
        changeLanguage: vi.fn(),
        isRTL: false,
        dir: 'ltr',
    }),
}));

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
    { courseId: 'course-1', status: 0, completionPercentage: 0 },   // not started
    { courseId: 'course-2', status: 1, completionPercentage: 50 },  // in progress
    { courseId: 'course-3', status: 2, completionPercentage: 100 }, // completed
    { courseId: 'course-4', status: 2, completionPercentage: 100 }, // completed
    { courseId: 'course-5', status: 1, completionPercentage: 100 }, // status lag: counts as completed
];

// Expected: totalCourses=5, inProgress=1 (status 1 but not completionPercentage>=100), completed=3

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

        // Total Courses: 5 courses enrolled
        const totalCard = screen.getByText('Total Courses').closest('.stat-card');
        expect(totalCard).toBeInTheDocument();
        expect(totalCard!.querySelector('.stat-value')!.textContent).toBe('05');

        // Courses in Progress: status === 1 && completionPercentage < 100 => 1
        const progressCard = screen.getByText('In Progress').closest('.stat-card');
        expect(progressCard).toBeInTheDocument();
        expect(progressCard!.querySelector('.stat-value')!.textContent).toBe('01');

        // Courses Completed: status === 2 (x2) + completionPercentage >= 100 with status lag (x1) => 3
        const completedCard = screen.getByText('Completed').closest('.stat-card');
        expect(completedCard).toBeInTheDocument();
        expect(completedCard!.querySelector('.stat-value')!.textContent).toBe('03');

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
