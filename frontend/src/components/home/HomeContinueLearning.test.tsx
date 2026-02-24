import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomeContinueLearning from './HomeContinueLearning';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock useUserEnrolledCollections
const mockUseUserEnrolledCollections = vi.fn();
vi.mock('@/hooks/useUserEnrolledCollections', () => ({
    useUserEnrolledCollections: () => mockUseUserEnrolledCollections(),
}));

// Mock useCollection
const mockUseCollection = vi.fn();
vi.mock('@/hooks/useCollection', () => ({
    useCollection: (id: string | undefined) => mockUseCollection(id),
}));

const mockCourses = [
    {
        courseId: 'course-1',
        courseName: 'React Fundamentals',
        collectionId: 'col-1',
        contentId: 'content-1',
        batchId: 'batch-1',
        completionPercentage: 45,
        lastContentAccessTime: 1700000000,
        lastReadContentId: 'last-read-1',
        courseLogoUrl: 'https://example.com/react.png',
        content: { primaryCategory: 'Course', name: 'React Fundamentals', appIcon: '' },
    },
    {
        courseId: 'course-2',
        courseName: 'Node.js Advanced',
        collectionId: 'col-2',
        contentId: 'content-2',
        batchId: 'batch-2',
        completionPercentage: 70,
        lastContentAccessTime: 1690000000,
        lastReadContentId: 'last-read-2',
        courseLogoUrl: '',
        content: { primaryCategory: 'Course', name: 'Node.js Advanced', appIcon: '' },
    },
    {
        courseId: 'course-3',
        courseName: 'Completed Course',
        collectionId: 'col-3',
        contentId: 'content-3',
        batchId: 'batch-3',
        completionPercentage: 100,
        lastContentAccessTime: 1710000000,
        courseLogoUrl: '',
        content: { primaryCategory: 'Course', name: 'Completed Course', appIcon: '' },
    },
];

describe('HomeContinueLearning', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseUserEnrolledCollections.mockReturnValue({
            data: { data: { courses: mockCourses } },
            isLoading: false,
        });
        mockUseCollection.mockReturnValue({ data: null });
    });

    const renderComponent = () => {
        return render(
            <BrowserRouter>
                <HomeContinueLearning />
            </BrowserRouter>
        );
    };

    it('renders the most recently accessed in-progress course title and thumbnail', () => {
        renderComponent();

        // course-1 has the most recent lastContentAccessTime among incomplete courses
        expect(screen.getByText('React Fundamentals')).toBeInTheDocument();

        const img = screen.getByAltText('React Fundamentals');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/react.png');
    });

    it('renders the progress percentage and circular progress component', () => {
        renderComponent();

        expect(screen.getByText('Completed : 45%')).toBeInTheDocument();

        // Check for the circular progress SVG
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveClass('transform -rotate-90');
    });

    it('navigates to the correct collection/batch/content URL when "Continue Learning" is clicked', () => {
        renderComponent();

        const button = screen.getByRole('button', { name: /Continue Learning/i });
        fireEvent.click(button);

        expect(mockNavigate).toHaveBeenCalledWith(
            '/collection/col-1/batch/batch-1/content/last-read-1'
        );
    });

    it('returns null when loading', () => {
        mockUseUserEnrolledCollections.mockReturnValue({
            data: undefined,
            isLoading: true,
        });

        const { container } = renderComponent();
        expect(container.innerHTML).toBe('');
    });

    it('returns null when no in-progress courses exist', () => {
        mockUseUserEnrolledCollections.mockReturnValue({
            data: { data: { courses: [mockCourses[2]] } }, // only completed course
            isLoading: false,
        });

        const { container } = renderComponent();
        expect(container.innerHTML).toBe('');
    });

    it('falls back to collection hierarchy first lesson when lastReadContentId is missing', () => {
        mockUseUserEnrolledCollections.mockReturnValue({
            data: {
                data: {
                    courses: [{
                        ...mockCourses[0],
                        lastReadContentId: undefined,
                    }],
                },
            },
            isLoading: false,
        });
        mockUseCollection.mockReturnValue({
            data: {
                modules: [{ lessons: [{ id: 'lesson-1' }] }],
            },
        });

        renderComponent();

        const button = screen.getByRole('button', { name: /Continue Learning/i });
        fireEvent.click(button);

        expect(mockNavigate).toHaveBeenCalledWith(
            '/collection/col-1/batch/batch-1/content/lesson-1'
        );
    });

    it('renders a placeholder when no thumbnail is available', () => {
        mockUseUserEnrolledCollections.mockReturnValue({
            data: {
                data: {
                    courses: [{
                        ...mockCourses[1],
                        lastContentAccessTime: 1700000000,
                        courseLogoUrl: '',
                        content: { ...mockCourses[1]!.content, appIcon: '' },
                    }],
                },
            },
            isLoading: false,
        });

        const { container } = renderComponent();

        // Should render the black placeholder div instead of an img
        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('.bg-black')).toBeInTheDocument();
    });
});
