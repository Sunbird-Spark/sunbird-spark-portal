import { describe, it, expect, vi } from 'vitest';
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

// Mock useIsMobile
vi.mock('@/hooks/use-mobile', () => ({
    useIsMobile: vi.fn(() => false),
}));

describe('HomeContinueLearning', () => {
    const renderComponent = () => {
        return render(
            <BrowserRouter>
                <HomeContinueLearning />
            </BrowserRouter>
        );
    };

    it('renders the course title and thumbnail', () => {
        renderComponent();

        // Check title (handles newline in title)
        expect(screen.getByText(/The AI Engineer Course 2026/)).toBeInTheDocument();

        // Check thumbnail
        const img = screen.getByAltText(/The AI Engineer Course 2026/);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', expect.stringContaining('unsplash'));
    });

    it('renders the progress percentage and circular progress component', () => {
        renderComponent();

        expect(screen.getByText('Completed : 30%')).toBeInTheDocument();

        // Check for the circular progress SVG
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg).toHaveClass('transform -rotate-90');
    });

    it('navigates to the course page when "Continue Learning" button is clicked', () => {
        renderComponent();

        const button = screen.getByRole('button', { name: /Continue Learning/i });
        fireEvent.click(button);

        expect(mockNavigate).toHaveBeenCalledWith('/course/1');
    });
});
