import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthenticatedHeader from './AuthenticatedHeader';
import * as useMobileModule from '@/hooks/use-mobile';

// Mock hooks
const mockNavigate = vi.fn();
const mockChangeLanguage = vi.fn();
const mockUseIsMobile = vi.fn(() => false);

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({
        t: (key: string) => key,
        languages: [
            { code: 'en', label: 'English' },
            { code: 'hi', label: 'हिंदी' },
            { code: 'ta', label: 'தமிழ்' },
        ],
        currentCode: 'en',
        changeLanguage: mockChangeLanguage,
    }),
}));

vi.mock('@/hooks/use-mobile', () => ({
    useIsMobile: () => mockUseIsMobile(),
}));

describe('AuthenticatedHeader', () => {
    const mockOnToggleSidebar = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseIsMobile.mockReturnValue(false);
    });

    describe('Desktop View', () => {
        it('renders header with logo when sidebar is open', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            expect(screen.getByAltText('Sunbird')).toBeInTheDocument();
            expect(screen.queryByLabelText('Toggle Sidebar')).not.toBeInTheDocument();
        });

        it('renders toggle button when sidebar is closed', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={false} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const toggleBtn = screen.getByLabelText('Toggle Sidebar');
            expect(toggleBtn).toBeInTheDocument();
            expect(screen.queryByAltText('Sunbird')).not.toBeInTheDocument();
        });

        it('calls onToggleSidebar when toggle button is clicked', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={false} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const toggleBtn = screen.getByLabelText('Toggle Sidebar');
            fireEvent.click(toggleBtn);

            expect(mockOnToggleSidebar).toHaveBeenCalledTimes(1);
        });

        it('renders search input on desktop', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            expect(screen.getByPlaceholderText('header.search')).toBeInTheDocument();
        });

        it('navigates to search page when search container is clicked', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const searchContainer = screen.getByPlaceholderText('header.search').closest('div');
            fireEvent.click(searchContainer!);

            expect(mockNavigate).toHaveBeenCalledWith('/search');
        });
    });

    describe('Mobile View', () => {
        beforeEach(() => {
            mockUseIsMobile.mockReturnValue(true);
        });

        it('renders mobile menu button', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={false} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            expect(screen.getByLabelText('Open Menu')).toBeInTheDocument();
        });

        it('renders mobile search button instead of input', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            expect(screen.getByLabelText('Search')).toBeInTheDocument();
            expect(screen.queryByPlaceholderText('header.search')).not.toBeInTheDocument();
        });

        it('navigates to search when mobile search button is clicked', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const searchBtn = screen.getByLabelText('Search');
            fireEvent.click(searchBtn);

            expect(mockNavigate).toHaveBeenCalledWith('/search');
        });

        it('calls onToggleSidebar when mobile menu is clicked', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={false} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const menuBtn = screen.getByLabelText('Open Menu');
            fireEvent.click(menuBtn);

            expect(mockOnToggleSidebar).toHaveBeenCalledTimes(1);
        });
    });

    describe('Common Features', () => {
        it('renders notifications button', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
        });

        it('renders language selector', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            expect(screen.getByAltText('Language')).toBeInTheDocument();
        });

        it('applies mobile class when on mobile', () => {
            mockUseIsMobile.mockReturnValue(true);

            const { container } = render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const header = container.querySelector('header');
            expect(header).toHaveClass('mobile');
        });

        it('does not apply mobile class when on desktop', () => {
            mockUseIsMobile.mockReturnValue(false);

            const { container } = render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const header = container.querySelector('header');
            expect(header).not.toHaveClass('mobile');
        });
    });
});
