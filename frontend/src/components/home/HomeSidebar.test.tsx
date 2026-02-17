import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
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

    const renderSidebar = (props: any = defaultProps) => {
        return render(
            <BrowserRouter>
                <HomeSidebar {...props} />
            </BrowserRouter>
        );
    };

    // Mock useIsMobile to safely test desktop behavior
    vi.mock("@/hooks/use-mobile", () => ({
        useIsMobile: () => false,
    }));

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
    it('hides Account Settings when on help-support route', () => {
        render(
            <MemoryRouter initialEntries={['/help-support']}>
                <HomeSidebar {...defaultProps} />
            </MemoryRouter>
        );

        expect(screen.queryByText('Account Settings')).not.toBeInTheDocument();
        expect(screen.getByText('Help and Support')).toBeInTheDocument();
    });

    it('renders in collapsed state', () => {
        renderSidebar({ ...defaultProps, collapsed: true });

        // Sidebar should have reduced width
        const sidebar = screen.getByTestId('home-sidebar');
        expect(sidebar).toHaveClass('w-[5rem]');

        // Text labels should not be visible (queryByText should return null for the label text wrapper)
        // Since we are conditionally rendering the span, we expect queryByText to potentially find the title attribute but not the visible text span
        // But since title attribute is on the button, getByText won't find it.
        // Let's verify that the span with text is NOT in the document.
        expect(screen.queryByText('Home')).not.toBeInTheDocument();
        expect(screen.queryByText('My Learning')).not.toBeInTheDocument();

        // Icons should still be there (we can find them by class or by checking if button exists)
        // Buttons should retain title attribute
        const homeButton = screen.getAllByRole('button')[0];
        expect(homeButton).toHaveAttribute('title', 'Home');
    });

    it('calls onToggle when toggle button is clicked', () => {
        const onToggle = vi.fn();
        renderSidebar({ ...defaultProps, onToggle });

        // Find the toggle button (it has aria-label "Collapse Sidebar" initially)
        const toggleBtn = screen.getByRole('button', { name: /Collapse Sidebar/i });
        fireEvent.click(toggleBtn);

        expect(onToggle).toHaveBeenCalledTimes(1);
    });
});
