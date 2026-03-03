import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomeDashboardContent from './HomeDashboardContent';

vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'myLearning.loading': 'Loading your dashboard...',
                'myLearning.errorLoading': 'Error loading your dashboard',
                'homeComponents.continueLearning': 'Continue from where you left',
            };
            return translations[key] || key;
        },
    }),
}));

vi.mock('@/components/common/PageLoader', () => ({
    default: ({ message, error, onRetry }: { message: string; error?: string; onRetry?: () => void }) => (
        <div data-testid="page-loader">
            <span>{message}</span>
            {error && <span data-testid="error-message">{error}</span>}
            {onRetry && <button onClick={onRetry}>Retry</button>}
        </div>
    ),
}));
vi.mock('@/components/home/HomeDiscoverSections', () => ({ default: () => <div data-testid="discover-sections" /> }));
vi.mock('@/components/home/HomeStatsCards', () => ({ default: () => <div data-testid="stats-cards" /> }));
vi.mock('@/components/home/HomeContinueLearning', () => ({ default: () => <div data-testid="continue-learning" /> }));
vi.mock('@/components/home/HomeInProgressGrid', () => ({ default: () => <div data-testid="inprogress-grid" /> }));
vi.mock('@/components/home/HomeRecommendedSection', () => ({ default: () => <div data-testid="recommended-section" /> }));

const defaultProps = {
    loading: false,
    error: undefined,
    enrolledCount: 2,
    onRetry: vi.fn(),
};

describe('HomeDashboardContent', () => {
    it('shows loader when loading', () => {
        render(<HomeDashboardContent {...defaultProps} loading={true} />);

        expect(screen.getByTestId('page-loader')).toBeInTheDocument();
        expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();
        expect(screen.queryByTestId('discover-sections')).not.toBeInTheDocument();
        expect(screen.queryByTestId('stats-cards')).not.toBeInTheDocument();
    });

    it('shows error state with message and retry button when error is provided', () => {
        const onRetry = vi.fn();
        render(<HomeDashboardContent {...defaultProps} loading={false} error="Network error" onRetry={onRetry} />);

        expect(screen.getByTestId('page-loader')).toBeInTheDocument();
        expect(screen.getByTestId('error-message')).toHaveTextContent('Network error');
        expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
        expect(screen.queryByTestId('stats-cards')).not.toBeInTheDocument();
    });

    it('shows discover sections when enrolledCount is 0', () => {
        render(<HomeDashboardContent {...defaultProps} enrolledCount={0} />);

        expect(screen.getByTestId('discover-sections')).toBeInTheDocument();
        expect(screen.queryByTestId('stats-cards')).not.toBeInTheDocument();
        expect(screen.queryByTestId('page-loader')).not.toBeInTheDocument();
    });

    it('renders full dashboard when enrolled in one course', () => {
        render(<HomeDashboardContent {...defaultProps} enrolledCount={1} />);

        expect(screen.getByTestId('stats-cards')).toBeInTheDocument();
        expect(screen.getByTestId('continue-learning')).toBeInTheDocument();
        expect(screen.getByTestId('recommended-section')).toBeInTheDocument();
        expect(screen.queryByTestId('inprogress-grid')).not.toBeInTheDocument();
        expect(screen.queryByTestId('discover-sections')).not.toBeInTheDocument();
    });

    it('shows in-progress grid when enrolled in more than one course', () => {
        render(<HomeDashboardContent {...defaultProps} enrolledCount={2} />);

        expect(screen.getByTestId('inprogress-grid')).toBeInTheDocument();
    });

    it('shows "Continue from where you left" heading when enrolled', () => {
        render(<HomeDashboardContent {...defaultProps} enrolledCount={1} />);

        expect(screen.getByText('Continue from where you left')).toBeInTheDocument();
    });

    it('loading takes priority over error', () => {
        render(<HomeDashboardContent {...defaultProps} loading={true} error="Some error" />);

        expect(screen.getByTestId('page-loader')).toBeInTheDocument();
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });

    it('error takes priority over enrolledCount', () => {
        render(<HomeDashboardContent {...defaultProps} loading={false} error="Oops" enrolledCount={0} />);

        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.queryByTestId('discover-sections')).not.toBeInTheDocument();
    });
});
