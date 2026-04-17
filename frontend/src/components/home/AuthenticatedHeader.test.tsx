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
        t: (key: string) => {
            const translations: Record<string, string> = {
                'onboarding.altSunbird': 'Sunbird',
                'homeComponents.openMenu': 'Open Menu',
                'header.search': 'Search',
                'changeLanguage': 'Language',
            };
            return translations[key] || key;
        },
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

vi.mock('@/components/common/SearchModal', () => ({
    default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
        isOpen ? <div data-testid="search-modal">Search Modal<button onClick={onClose}>Close</button></div> : null,
}));

vi.mock('@/components/common/NotificationPopover', () => ({
    NotificationPopover: () => <button aria-label="Notifications" />,
}));

vi.mock('@/components/common/DropdownMenu', () => ({
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
    DropdownMenuItem: ({ children, onSelect }: any) => <button onClick={onSelect}>{children}</button>,
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
        });

        it('renders logo on desktop', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={false} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );
            expect(screen.getByAltText('Sunbird')).toBeInTheDocument();
        });

        it('logo links to /home for logged-in users', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const logoLink = screen.getByAltText('Sunbird').closest('a');
            expect(logoLink).toHaveAttribute('href', '/home');
        });

        it('renders search button on desktop', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            expect(screen.getByLabelText('Search')).toBeInTheDocument();
        });

        it('opens search modal when search button is clicked', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const searchButton = screen.getByLabelText('Search');
            fireEvent.click(searchButton);

            expect(screen.getByTestId('search-modal')).toBeInTheDocument();
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
        });

        it('opens search modal when mobile search button is clicked', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const searchBtn = screen.getByLabelText('Search');
            fireEvent.click(searchBtn);

            expect(screen.getByTestId('search-modal')).toBeInTheDocument();
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

        it('closes search modal when onClose is called (line 104)', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );
            fireEvent.click(screen.getByLabelText('Search'));
            expect(screen.getByTestId('search-modal')).toBeInTheDocument();
            fireEvent.click(screen.getByText('Close'));
            expect(screen.queryByTestId('search-modal')).not.toBeInTheDocument();
        });

        it('selects language and calls changeLanguage (line 90)', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );
            // DropdownMenuItem mock renders items as buttons with onSelect as onClick
            fireEvent.click(screen.getByText('हिंदी'));
            expect(mockChangeLanguage).toHaveBeenCalledWith('hi');
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
