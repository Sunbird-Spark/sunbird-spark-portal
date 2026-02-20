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

vi.mock('@/components/common/SearchModal', () => ({
    default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
        isOpen ? <div data-testid="search-modal">Search Modal<button onClick={onClose}>Close</button></div> : null,
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

        // Desktop no longer has a toggle button in the header.
        it('renders logo on desktop', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={false} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );
            expect(screen.getByAltText('Sunbird')).toBeInTheDocument();
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

    describe('Notification Functionality', () => {
        it('displays notification badge when notifications exist', () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const badge = document.querySelector('.notification-badge');
            expect(badge).toBeInTheDocument();
        });

        it('opens notification popover when bell icon is clicked', async () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const notificationBtn = screen.getByLabelText('Notifications');
            fireEvent.click(notificationBtn);

            expect(await screen.findByText('Notifications')).toBeInTheDocument();
        });

        it('displays all notification groups (Today, Yesterday, Older)', async () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const notificationBtn = screen.getByLabelText('Notifications');
            fireEvent.click(notificationBtn);

            expect(await screen.findByText('Today')).toBeInTheDocument();
            expect(await screen.findByText('Yesterday')).toBeInTheDocument();
            expect(await screen.findByText('Older')).toBeInTheDocument();
        });

        it('displays notification messages and timestamps', async () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const notificationBtn = screen.getByLabelText('Notifications');
            fireEvent.click(notificationBtn);

            expect(await screen.findAllByText(/New course has been assigned to group 1/)).toHaveLength(2);
            expect(await screen.findByText(/Sun, 08 February, 09:30 am/)).toBeInTheDocument();
        });

        it('displays "Delete All" button when notifications exist', async () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const notificationBtn = screen.getByLabelText('Notifications');
            fireEvent.click(notificationBtn);

            expect(await screen.findByText('Delete All')).toBeInTheDocument();
        });

        it('deletes individual notification when delete button is clicked', async () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const notificationBtn = screen.getByLabelText('Notifications');
            fireEvent.click(notificationBtn);

            // Wait for notifications to appear
            await screen.findByText('Today');
            
            const initialNotifications = screen.getAllByText(/New course has been assigned|An assignment has been added/);
            const initialCount = initialNotifications.length;
            
            // Find all notification items
            const notificationItems = document.querySelectorAll('.notification-item');
            expect(notificationItems.length).toBeGreaterThan(0);
            
            // Find the delete button within the first notification item
            const firstNotificationItem = notificationItems[0];
            expect(firstNotificationItem).toBeDefined();
            
            const firstDeleteBtn = firstNotificationItem?.querySelector('.notification-item-delete-btn');
            expect(firstDeleteBtn).toBeInTheDocument();
            
            if (firstDeleteBtn) {
                fireEvent.click(firstDeleteBtn);
            }

            // Check that one notification was removed
            const updatedNotifications = screen.queryAllByText(/New course has been assigned|An assignment has been added/);
            expect(updatedNotifications.length).toBe(initialCount - 1);
        });

        it('deletes all notifications when "Delete All" is clicked', async () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const notificationBtn = screen.getByLabelText('Notifications');
            fireEvent.click(notificationBtn);

            const deleteAllBtn = await screen.findByText('Delete All');
            fireEvent.click(deleteAllBtn);

            expect(await screen.findByText('No notifications')).toBeInTheDocument();
            expect(screen.queryByText('Delete All')).not.toBeInTheDocument();
        });

        it('hides notification badge when all notifications are deleted', async () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const notificationBtn = screen.getByLabelText('Notifications');
            fireEvent.click(notificationBtn);

            const deleteAllBtn = await screen.findByText('Delete All');
            fireEvent.click(deleteAllBtn);

            const badge = document.querySelector('.notification-badge');
            expect(badge).not.toBeInTheDocument();
        });

        it('displays "No notifications" message when no notifications exist', async () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const notificationBtn = screen.getByLabelText('Notifications');
            fireEvent.click(notificationBtn);

            const deleteAllBtn = await screen.findByText('Delete All');
            fireEvent.click(deleteAllBtn);

            expect(await screen.findByText('No notifications')).toBeInTheDocument();
        });

        it('groups notifications correctly by date', async () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const notificationBtn = screen.getByLabelText('Notifications');
            fireEvent.click(notificationBtn);

            const todaySection = await screen.findByText('Today');
            const todayParent = todaySection.closest('div')?.parentElement;
            
            expect(todayParent).toBeInTheDocument();
        });

        it('does not display "Delete All" button when no notifications exist', async () => {
            render(
                <MemoryRouter>
                    <AuthenticatedHeader isSidebarOpen={true} onToggleSidebar={mockOnToggleSidebar} />
                </MemoryRouter>
            );

            const notificationBtn = screen.getByLabelText('Notifications');
            fireEvent.click(notificationBtn);

            const deleteAllBtn = await screen.findByText('Delete All');
            fireEvent.click(deleteAllBtn);

            await screen.findByText('No notifications');
            
            expect(screen.queryByText('Delete All')).not.toBeInTheDocument();
        });
    });
});
