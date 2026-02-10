import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomeSidebar from './HomeSidebar';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('HomeSidebar', () => {
    const defaultProps = {
        activeNav: 'home',
        onNavChange: vi.fn(),
    };

    const renderSidebar = (props = defaultProps) => {
        return render(
            <BrowserRouter>
                <HomeSidebar {...props} />
            </BrowserRouter>
        );
    };

    it('renders all navigation items', () => {
        renderSidebar();

        // Main Nav Items
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('My Learning')).toBeInTheDocument();
        expect(screen.getByText('Explore')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();

        // Bottom Nav Items
        expect(screen.getByText('Help and Support')).toBeInTheDocument();
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('calls onNavChange when an item is clicked', () => {
        const onNavChange = vi.fn();
        renderSidebar({ ...defaultProps, onNavChange });

        fireEvent.click(screen.getByText('My Learning'));
        expect(onNavChange).toHaveBeenCalledWith('learning');
    });

    it('navigates to path when a non-home item is clicked', () => {
        renderSidebar();

        fireEvent.click(screen.getByText('My Learning'));
        expect(mockNavigate).toHaveBeenCalledWith('/my-learning');

        fireEvent.click(screen.getByText('Explore'));
        expect(mockNavigate).toHaveBeenCalledWith('/explore');
    });

    it('does not navigate when Home is clicked (since it stays on the page)', () => {
        mockNavigate.mockClear();
        renderSidebar();

        fireEvent.click(screen.getByText('Home'));
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('highlights the active item', () => {
        renderSidebar({ ...defaultProps, activeNav: 'learning' });

        const learningButton = screen.getByText('My Learning').closest('button');
        expect(learningButton).toHaveClass('text-sunbird-brick font-normal');

        const homeButton = screen.getByText('Home').closest('button');
        expect(homeButton).toHaveClass('text-sunbird-obsidian font-normal');
        expect(homeButton).toHaveClass('px-6');
    });

    it('renders the correct icons for active/inactive states', () => {
        const { rerender } = renderSidebar({ ...defaultProps, activeNav: 'home' });

        // When home is active, it should use GoHomeFill (not easily testable via class but we can check if it renders)
        // Check for specific classes applied to icons
        const homeIcon = screen.getByText('Home').previousSibling;
        expect(homeIcon).toHaveClass('text-sunbird-brick');

        rerender(
            <BrowserRouter>
                <HomeSidebar {...defaultProps} activeNav="learning" />
            </BrowserRouter>
        );

        const inactiveHomeIcon = screen.getByText('Home').previousSibling;
        expect(inactiveHomeIcon).toHaveClass('text-sunbird-ginger');
    });
});
