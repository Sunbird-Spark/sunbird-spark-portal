import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomeInProgressGrid from './HomeInProgressGrid';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('HomeInProgressGrid', () => {
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

    it('renders all in-progress items', () => {
        renderComponent();

        // Check for specific items
        expect(screen.getAllByText('Data Engineering Foundations').length).toBeGreaterThan(0);
        expect(screen.getAllByText(/The AI Engineer Course/).length).toBeGreaterThan(0);

        // Should have 6 items in the grid
        const cards = document.querySelectorAll('.home-inprogress-card');
        expect(cards.length).toBe(6);
    });

    it('displays the correct badge and progress for items', () => {
        renderComponent();

        // Item 1: Course, 70%
        expect(screen.getAllByText('Course')[0]).toBeInTheDocument();
        expect(screen.getByText('70%')).toBeInTheDocument();

        // Item 2: Textbook, 30%
        expect(screen.getAllByText('Textbook')[0]).toBeInTheDocument();
        expect(screen.getAllByText('30%')[0]).toBeInTheDocument();
    });

    it('navigates to the course page when a card is clicked', () => {
        renderComponent();

        const firstCard = document.querySelectorAll('.home-inprogress-card')[0];
        fireEvent.click(firstCard);

        expect(mockNavigate).toHaveBeenCalled();
        // Since it's item 1, it should navigate to /course/1
        expect(mockNavigate).toHaveBeenCalledWith('/course/1');
    });

    it('renders thumbnails with correct alt text', () => {
        renderComponent();

        // Use a more specific query if needed, but let's check one
        const altText = "Data Engineering Foundations";
        const imgs = screen.getAllByAltText(altText);
        expect(imgs.length).toBeGreaterThan(0);
    });
});
