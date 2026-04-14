import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomeRecommendedSection from './HomeRecommendedSection';
import { useContentSearch } from '@/hooks/useContent';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock useContentSearch
vi.mock('@/hooks/useContent', () => ({
    useContentSearch: vi.fn(),
}));

// Mock useAppI18n
vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({
        t: (key: string, options?: any) => {
            const translations: Record<string, string> = {
                'homeComponents.recommendedContents': 'homeComponents.recommendedContents',
            };
            return translations[key] || (options?.defaultValue || key);
        },
    }),
}));

const mockRecommendedItems = [
    {
        identifier: '1',
        name: 'Complete AI Engineer Bootcamp',
        mimeType: 'application/vnd.ekstep.content-collection',
        primaryCategory: 'Course', // CollectionCard uses this
        contentType: 'Course',
        objectType: 'Content',
        appIcon: 'icon1.jpg',
    },
    {
        identifier: '2',
        name: 'Generative AI for Cybersecurity Professionals',
        mimeType: 'video/mp4', // ResourceCard uses this -> Video
        contentType: 'Resource',
        objectType: 'Content',
        appIcon: 'icon2.jpg',
    },
    {
        identifier: '3',
        name: 'Data Engineering Foundations',
        mimeType: 'application/pdf', // ResourceCard uses this -> PDF
        contentType: 'Resource',
        objectType: 'Content',
        appIcon: 'icon3.jpg',
    }
];

describe('HomeRecommendedSection', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default Mock Implementation
        (useContentSearch as any).mockReturnValue({
            data: {
                data: {
                    content: mockRecommendedItems
                }
            },
            isLoading: false,
        });
    });

    const renderComponent = () => {
        return render(
            <BrowserRouter>
                <HomeRecommendedSection creatorIds={['user1']} />
            </BrowserRouter>
        );
    };

    it('renders the section title and "View All" arrow link', () => {
        renderComponent();
        expect(screen.getByText('homeComponents.recommendedContents')).toBeInTheDocument();

        const links = screen.getAllByRole('link');
        const exploreLink = links.find(l => l.getAttribute('href') === '/explore');
        expect(exploreLink).toBeInTheDocument();
    });

    it('renders all recommended items', () => {
        renderComponent();

        expect(screen.getByText('Complete AI Engineer Bootcamp')).toBeInTheDocument();
        expect(screen.getByText('Generative AI for Cybersecurity Professionals')).toBeInTheDocument();
        expect(screen.getByText('Data Engineering Foundations')).toBeInTheDocument();
    });

    it('renders correct badges for different types', () => {
        renderComponent();

        // Item 1: CollectionCard renders primaryCategory
        expect(screen.getByText('Course')).toBeInTheDocument();

        // Item 2: ResourceCard renders "Video" for video/mp4
        // The mock t function returns defaultValue when key is not in translations
        // ResourceCard: t("resource.videoBadge", { defaultValue: "Video" })
        expect(screen.getAllByText('Video').length).toBeGreaterThan(0);

        // Item 3: ResourceCard renders "PDF" for application/pdf
        // ResourceCard: t("resource.pdfBadge", { defaultValue: "PDF" })
        expect(screen.getAllByText('PDF').length).toBeGreaterThan(0);
    });

    it('navigates when a card is clicked', () => {
        renderComponent();

        // Item 1: CollectionCard links to /collection/:id
        const firstCard = screen.getByText('Complete AI Engineer Bootcamp').closest('a');
        expect(firstCard).toHaveAttribute('href', '/collection/1');

        // Item 2: ResourceCard links to /content/:id
        const videoCard = screen.getByText('Generative AI for Cybersecurity Professionals').closest('a');
        expect(videoCard).toHaveAttribute('href', '/content/2');
    });


    it('filters out enrolled courses', () => {
        render(
            <BrowserRouter>
                <HomeRecommendedSection enrolledCourseIds={['1']} />
            </BrowserRouter>
        );

        // Course '1' should NOT be present
        expect(screen.queryByText('Complete AI Engineer Bootcamp')).not.toBeInTheDocument();

        // Other courses should still be present
        expect(screen.getByText('Generative AI for Cybersecurity Professionals')).toBeInTheDocument();
        expect(screen.getByText('Data Engineering Foundations')).toBeInTheDocument();
    });
});
