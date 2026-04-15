import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomeInProgressGrid from './HomeInProgressGrid';

vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({
        t: (key: string, options?: any) => {
            const translations: Record<string, string> = {
                'homeComponents.inProgress': 'In Progress',
                'loading': 'Loading...',
                'homeComponents.noCoursesInProgress': 'No courses in progress',
            };
            return translations[key] || (options?.defaultValue || key);
        },
    }),
}));

// Mock useUserEnrolledCollections
const mockUseUserEnrolledCollections = vi.hoisted(() => vi.fn());
vi.mock('../../hooks/useUserEnrolledCollections', () => ({
    useUserEnrolledCollections: () => mockUseUserEnrolledCollections(),
}));

const mockCourses = [
    {
        courseId: 'course-1',
        courseName: 'Data Engineering Foundations',
        collectionId: 'col-1',
        contentId: 'content-1',
        batchId: 'batch-1',
        completionPercentage: 70,
        lastReadContentId: 'last-read-1',
        courseLogoUrl: 'https://example.com/data-eng.png',
        content: { primaryCategory: 'Course', name: 'Data Engineering Foundations', appIcon: '' },
    },
    {
        courseId: 'course-2',
        courseName: 'AI Engineer Course',
        collectionId: 'col-2',
        contentId: 'content-2',
        batchId: 'batch-2',
        completionPercentage: 30,
        lastReadContentId: undefined,
        courseLogoUrl: '',
        content: { primaryCategory: 'Textbook', name: 'AI Engineer Course', appIcon: 'https://example.com/ai.png' },
    },
    {
        courseId: 'course-3',
        courseName: 'Completed Course',
        collectionId: 'col-3',
        contentId: 'content-3',
        batchId: 'batch-3',
        completionPercentage: 100,
        lastReadContentId: 'last-read-3',
        courseLogoUrl: '',
        content: { primaryCategory: 'Course', name: 'Completed Course', appIcon: '' },
    },
];

describe('HomeInProgressGrid', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mockUseUserEnrolledCollections.mockReturnValue({
            data: { data: { courses: mockCourses } },
            isLoading: false,
        });
    });

    const renderComponent = () => {
        return render(
            <BrowserRouter>
                <HomeInProgressGrid />
            </BrowserRouter>
        );
    };

    it('renders the section title', () => {
        renderComponent();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('renders only in-progress items (excludes completed)', () => {
        renderComponent();

        expect(screen.getByText('Data Engineering Foundations')).toBeInTheDocument();
        expect(screen.getByText('AI Engineer Course')).toBeInTheDocument();

        // Completed course should not appear
        expect(screen.queryByText('Completed Course')).not.toBeInTheDocument();

        const cards = document.querySelectorAll('.home-inprogress-card');
        expect(cards.length).toBe(2);
    });

    it('displays the correct badge and progress for items', () => {
        renderComponent();

        expect(screen.getAllByText('Course')[0]).toBeInTheDocument();
        expect(screen.getByText('70%')).toBeInTheDocument();

        expect(screen.getByText('Textbook')).toBeInTheDocument();
        expect(screen.getByText('30%')).toBeInTheDocument();
    });

    it('links to collection/batch/content URL when lastReadContentId is present', () => {
        renderComponent();

        const firstCard = document.querySelectorAll('.home-inprogress-card')[0];
        expect(firstCard).toHaveAttribute('href', '/collection/col-1/batch/batch-1/content/last-read-1');
    });

    it('links to collection/batch URL when lastReadContentId is missing', () => {
        renderComponent();

        const secondCard = document.querySelectorAll('.home-inprogress-card')[1];
        expect(secondCard).toHaveAttribute('href', '/collection/col-2/batch/batch-2');
    });

    it('renders thumbnails with correct alt text', () => {
        renderComponent();

        const img = screen.getByAltText('Data Engineering Foundations');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/data-eng.png');
    });

    it('falls back to content.appIcon when courseLogoUrl is empty', () => {
        renderComponent();

        const img = screen.getByAltText('AI Engineer Course');
        expect(img).toHaveAttribute('src', 'https://example.com/ai.png');
    });

    it('shows loading state', () => {
        mockUseUserEnrolledCollections.mockReturnValue({
            data: undefined,
            isLoading: true,
        });

        renderComponent();

        expect(screen.getByText('In Progress')).toBeInTheDocument();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows empty state when no in-progress courses', () => {
        mockUseUserEnrolledCollections.mockReturnValue({
            data: { data: { courses: [mockCourses[2]] } }, // only completed
            isLoading: false,
        });

        renderComponent();

        expect(screen.getByText('No courses in progress')).toBeInTheDocument();
    });

    it('uses ?? [] fallback when courses is undefined (line 21 ?? branch)', () => {
        mockUseUserEnrolledCollections.mockReturnValue({
            data: { data: {} }, // no courses field → undefined → ?? []
            isLoading: false,
        });

        renderComponent();

        expect(screen.getByText('No courses in progress')).toBeInTheDocument();
    });

    it('falls back to "Untitled Course" when both courseName and content.name are absent (line 78)', () => {
        mockUseUserEnrolledCollections.mockReturnValue({
            data: {
                data: {
                    courses: [{
                        courseId: 'c-noname',
                        courseName: '',
                        collectionId: 'col-noname',
                        contentId: 'cnt-noname',
                        batchId: 'b1',
                        completionPercentage: 30,
                        lastReadContentId: null,
                        courseLogoUrl: '',
                        content: { primaryCategory: 'Course', name: '', appIcon: '' },
                    }],
                },
            },
            isLoading: false,
        });

        renderComponent();

        const imgs = screen.getAllByRole('img');
        // The alt text should fall back to "Untitled Course"
        expect(imgs[0]).toHaveAttribute('alt', 'Untitled Course');
    });

    it('uses content.posterImage for thumbnail when available (line 77 first || branch)', () => {
        mockUseUserEnrolledCollections.mockReturnValue({
            data: {
                data: {
                    courses: [{
                        courseId: 'c-poster',
                        courseName: 'Poster Course',
                        collectionId: 'col-p',
                        contentId: 'cnt-p',
                        batchId: 'b1',
                        completionPercentage: 50,
                        lastReadContentId: null,
                        courseLogoUrl: '',
                        content: { primaryCategory: 'Course', name: 'Poster Course', appIcon: '', posterImage: 'https://poster.png' },
                    }],
                },
            },
            isLoading: false,
        });

        renderComponent();

        expect(screen.getByAltText('Poster Course')).toHaveAttribute('src', 'https://poster.png');
    });
});
