import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomeRecommendedSection from './HomeRecommendedSection';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('HomeRecommendedSection', () => {
    const renderComponent = () => {
        return render(
            <BrowserRouter>
                <HomeRecommendedSection />
            </BrowserRouter>
        );
    };

    it('renders the section title and "View All" arrow link', () => {
        renderComponent();
        expect(screen.getByText('Recommended Contents')).toBeInTheDocument();

        const links = screen.getAllByRole('link');
        const exploreLink = links.find(l => l.getAttribute('href') === '/explore');
        expect(exploreLink).toBeInTheDocument();
    });

    it('renders all recommended items', () => {
        renderComponent();

        // Check for specific items
        expect(screen.getByText(/Complete AI Engineer Bootcamp/)).toBeInTheDocument();
        expect(screen.getByText('Generative AI for Cybersecurity Professionals')).toBeInTheDocument();
        expect(screen.getAllByText('Data Engineering Foundations').length).toBeGreaterThan(0);
    });

    it('renders correct badges for different types', () => {
        renderComponent();

        expect(screen.getAllByText('Course').length).toBeGreaterThan(0);
        expect(screen.getByText('Video')).toBeInTheDocument();
        expect(screen.getAllByText('Textbook').length).toBeGreaterThan(0);
    });

    it('renders stats for course/textbook items', () => {
        renderComponent();

        // Item 1 has 4.5 rating, 9k learners, 25 lessons
        expect(screen.getAllByText('4.5').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/9k Learners/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/25 Lessons/).length).toBeGreaterThan(0);
    });

    it('navigates when a card is clicked', () => {
        renderComponent();

        // Check first item - it should be a link with correct href
        const firstCard = screen.getByText(/Complete AI Engineer Bootcamp/).closest('a');
        expect(firstCard).toHaveAttribute('href', '/course/1');

        // Check video card - it should be a link with correct href
        const videoCard = screen.getByText('Generative AI for Cybersecurity Professionals').closest('a');
        expect(videoCard).toHaveAttribute('href', '/course/2');
    });

    it('renders video CTA button on video card', () => {
        renderComponent();
        expect(screen.getByText('View The Video')).toBeInTheDocument();
    });
});
