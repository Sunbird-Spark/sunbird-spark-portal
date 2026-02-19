import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileLearningList from './ProfileLearningList';
import { useUserEnrolledCollections } from '@/hooks/useUserEnrolledCollections';

// Mock hook
vi.mock('@/hooks/useUserEnrolledCollections', () => ({
    useUserEnrolledCollections: vi.fn(),
}));

// Mock DropdownMenu to render content inline for easy testing
vi.mock('@/components/common/DropdownMenu', () => ({
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-trigger">{children}</div>,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-content">{children}</div>,
    DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
        <button data-testid={`filter-option-${children?.toString().toLowerCase()}`} onClick={onClick}>
            {children}
        </button>
    ),
}));

// Mock PageLoader
vi.mock('@/components/common/PageLoader', () => ({
    default: ({ message }: { message: string }) => <div>{message}</div>,
}));

describe('ProfileLearningList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useUserEnrolledCollections as any).mockReturnValue({
            data: {
                data: {
                    courses: [
                        { courseId: '1', status: 1, courseName: 'Ongoing Course', completionPercentage: 50 },
                        { courseId: '2', status: 2, courseName: 'Completed Course', completionPercentage: 100 }
                    ]
                }
            },
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        });
    });

    it('renders the list of courses', () => {
        render(<ProfileLearningList />);
        expect(screen.getByText('Ongoing Course')).toBeInTheDocument();
        expect(screen.getByText('Completed Course')).toBeInTheDocument();
        // Check default filter label
        expect(screen.getByText('all')).toBeInTheDocument(); // capitalized by CSS but text in DOM is 'all' or 'All' depending on logic.
        expect(screen.getByTestId('filter-option-all')).toBeInTheDocument(); // capitalized by CSS but text in DOM is 'all' or 'All' depending on logic.
        // My code: <span className="capitalize">{filter}</span> where filter is "all" 
        // So DOM has "all"
    });

    it('filters by Ongoing', () => {
        render(<ProfileLearningList />);

        // Click "Ongoing" filter option (exposed by mock)
        fireEvent.click(screen.getByTestId('filter-option-ongoing'));

        // Should show Ongoing Course
        expect(screen.getByText('Ongoing Course')).toBeInTheDocument();
        // Should NOT show Completed Course
        expect(screen.queryByText('Completed Course')).not.toBeInTheDocument();
    });

    it('filters by Completed', () => {
        render(<ProfileLearningList />);

        // Click "Completed" filter option
        fireEvent.click(screen.getByTestId('filter-option-completed'));

        // Should NOT show Ongoing Course
        expect(screen.queryByText('Ongoing Course')).not.toBeInTheDocument();
        // Should show Completed Course
        expect(screen.getByText('Completed Course')).toBeInTheDocument();
    });

    it('shows empty state when no courses match filter', () => {
        (useUserEnrolledCollections as any).mockReturnValue({
            data: {
                data: {
                    courses: [
                        { courseId: '2', status: 2, courseName: 'Completed Course', completionPercentage: 100 }
                    ]
                }
            },
            isLoading: false,
            isError: false,
        });

        render(<ProfileLearningList />);

        // Filter by Ongoing
        fireEvent.click(screen.getByTestId('filter-option-ongoing'));

        expect(screen.getByText('No ongoing courses found.')).toBeInTheDocument();
    });
});
