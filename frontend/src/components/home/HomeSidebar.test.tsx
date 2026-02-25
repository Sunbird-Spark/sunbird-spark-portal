import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import HomeSidebar from './HomeSidebar';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';
import { useIsAdmin } from '@/hooks/useUser';

// Mock useNavigate and useLocation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: vi.fn(() => ({ pathname: '/home', search: '', hash: '', state: null, key: 'default', unstable_mask: undefined } as any)),
    };
});

// Mock authentication
vi.mock('@/auth/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
    default: {
        isUserAuthenticated: vi.fn(),
    },
}));

// Mock useIsMobile to safely test desktop behavior
vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: () => false,
}));

// Mock useIsAdmin — defaults to false (non-admin) so User Management link is hidden
vi.mock('@/hooks/useUser', () => ({
    useIsAdmin: vi.fn(),
    useIsContentCreator: vi.fn(),
}));

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

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, user: {} as any, login: vi.fn(), logout: vi.fn() } as any);
        vi.mocked(userAuthInfoService.isUserAuthenticated).mockReturnValue(true);
        vi.mocked(useLocation).mockReturnValue({ pathname: '/home', search: '', hash: '', state: null, key: 'default' } as any);
        vi.mocked(useIsAdmin).mockReturnValue(false);
    });



    it('returns null when not authenticated', () => {
        vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false, user: null, login: vi.fn(), logout: vi.fn() } as any);
        vi.mocked(userAuthInfoService.isUserAuthenticated).mockReturnValue(false);

        const { container } = renderSidebar();
        expect(container.firstChild).toBeNull();
    });

    it('returns null when on home route (/)', () => {
        vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, user: {} as any, login: vi.fn(), logout: vi.fn() } as any);
        vi.mocked(useLocation).mockReturnValue({ pathname: '/', search: '', hash: '', state: null, key: 'default' } as any);

        const { container } = renderSidebar();
        expect(container.firstChild).toBeNull();
    });

    it('renders all navigation items when authenticated and not on /', () => {
        vi.mocked(useAuth).mockReturnValue({ isAuthenticated: true, user: {} as any, login: vi.fn(), logout: vi.fn() } as any);
        vi.mocked(useLocation).mockReturnValue({ pathname: '/home', search: '', hash: '', state: null, key: 'default' } as any);

        renderSidebar();

        // Main Nav Items
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('My Learning')).toBeInTheDocument();
        expect(screen.getByText('Explore')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();

        // Bottom Nav Items
        expect(screen.getByText('Help and Support')).toBeInTheDocument();
        // expect(screen.getByText('Account Settings')).toBeInTheDocument(); // Removed as it's not in the component
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
        // Since Account Settings is not even in the list anymore, this test is redundant
        // but let's keep it to verify Help and Support is still there.
        render(
            <MemoryRouter initialEntries={['/help-support']}>
                <HomeSidebar {...defaultProps} />
            </MemoryRouter>
        );

        expect(screen.getByText('Help and Support')).toBeInTheDocument();
    });

    it('renders in collapsed state', () => {
        renderSidebar({ ...defaultProps, collapsed: true });

        // Sidebar should have reduced width
        const sidebar = screen.getByTestId('home-sidebar');
        expect(sidebar).toHaveClass('w-[5rem]');

        // Text labels should not be visible
        expect(screen.queryByText('Home')).not.toBeInTheDocument();
        expect(screen.queryByText('My Learning')).not.toBeInTheDocument();

        // Icons should still be there
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
