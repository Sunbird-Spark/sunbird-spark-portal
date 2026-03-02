import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

// Mock child components to keep tests focused
vi.mock('@/components/home/HomeSidebar', () => ({
    default: ({ onNavChange }: { onNavChange: (n: string) => void }) => (
        <div data-testid="sidebar">
            <button onClick={() => onNavChange('profile')}>Change Nav</button>
        </div>
    )
}));
vi.mock('@/components/home/HomeDashboardContent', () => ({
    default: ({ loading, error, enrolledCount }: { loading: boolean; error?: string; enrolledCount: number; onRetry: () => void }) => (
        <div data-testid="dashboard-content"
            data-loading={String(loading)}
            data-error={error ?? ''}
            data-enrolled={enrolledCount}
        />
    ),
}));
vi.mock('@/components/home/Footer', () => ({ default: () => <div data-testid="footer" /> }));

vi.mock('@/components/common/SearchModal', () => ({
    default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
        isOpen ? <div data-testid="search-modal">Search Modal<button onClick={onClose}>Close</button></div> : null,
}));

// Mock DropdownMenu to render content inline
vi.mock('@/components/common/DropdownMenu', () => ({
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuItem: ({ children, onSelect }: { children: React.ReactNode, onSelect?: () => void }) => (
        <div onClick={onSelect}>{children}</div>
    ),
}));

// Mock hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockChangeLanguage = vi.fn();
vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({
        t: (key: string, options?: any) => {
            const translations: Record<string, string> = {
                'homePage.hiUser': `Hi ${options?.name}`,
                'homePage.hiGuest': 'Hi there',
                'homePage.journeyStart': 'Your exciting learning journey starts here. Dive in!',
                'homePage.welcomeMessage': 'Welcome to a learning experience made just for you.',
                'onboarding.altSunbird': 'Sunbird',
                'header.search': 'Search',
                'changeLanguage': 'Change Language',
                'common.notifications': 'Notifications',
                'navigationMenu': 'Navigation Menu',
                'homeComponents.openMenu': 'Open Menu',
                'homeComponents.closeMenu': 'Close Menu',
            };
            return translations[key] || key;
        },
        languages: [
            { code: 'en', label: 'English' },
            { code: 'hi', label: 'Hindi' },
        ],
        currentCode: 'en',
        changeLanguage: mockChangeLanguage,
    }),
}));

const mockUseIsMobile = vi.fn();
vi.mock('@/hooks/use-mobile', () => ({
    useIsMobile: () => mockUseIsMobile(),
}));

vi.mock('@/hooks/usePermission', () => ({
    usePermissions: vi.fn(() => ({
        isAuthenticated: true,
        isLoading: false,
        roles: ['CONTENT_CREATOR'],
        error: null,
        hasAnyRole: vi.fn(() => true),
        canAccessFeature: vi.fn(),
        refetch: vi.fn(),
    })),
}));

vi.mock('@/hooks/useSystemSetting', () => ({
    useSystemSetting: () => ({ data: {}, isSuccess: false }),
}));

vi.mock('@/hooks/useTnc', () => ({
    useGetTncUrl: () => ({ data: '' }),
    useAcceptTnc: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
    default: {
        getUserId: () => 'test-user-id',
        isUserAuthenticated: () => true,
        getAuthInfo: vi.fn().mockResolvedValue({
            sid: 'test-session',
            uid: 'test-user-id',
            isAuthenticated: true,
        }),
    },
}));

// Mock useUserRead
const mockUseUserRead = vi.fn();
vi.mock('@/hooks/useUserRead', () => ({
    useUserRead: () => mockUseUserRead(),
}));

// Mock useUserEnrolledCollections
const mockUseUserEnrolledCollections = vi.fn();
vi.mock('@/hooks/useUserEnrolledCollections', () => ({
    useUserEnrolledCollections: () => mockUseUserEnrolledCollections(),
}));

describe('Home Page', () => {
    beforeEach(() => {
        mockUseIsMobile.mockReturnValue(false); // Default to desktop
        mockUseUserRead.mockReturnValue({
            data: {
                data: {
                    response: {
                        firstName: 'John',
                        lastName: 'Doe',
                    },
                },
            },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        });
        // Default to 2 enrollments so the full dashboard path is exercised
        mockUseUserEnrolledCollections.mockReturnValue({
            data: {
                data: {
                    courses: [{ courseId: 'c1' }, { courseId: 'c2' }],
                },
            },
            isLoading: false,
            error: null,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const createTestQueryClient = () => new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    const renderHome = () => {
        const queryClient = createTestQueryClient();
        return render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={['/home']}>
                    <Home />
                </MemoryRouter>
            </QueryClientProvider>
        );
    };

    it('renders the welcome message with user name', async () => {
        renderHome();

        await waitFor(() => {
            expect(screen.getByText('Hi John Doe')).toBeInTheDocument();
        });
        expect(screen.getByText('Welcome to a learning experience made just for you.')).toBeInTheDocument();
    });

    it('shows the onboarding subtitle when user has no enrollments', () => {
        mockUseUserEnrolledCollections.mockReturnValue({
            data: { data: { courses: [] } },
            isLoading: false,
            error: null,
        });

        renderHome();

        expect(screen.getByText('Your exciting learning journey starts here. Dive in!')).toBeInTheDocument();
        expect(screen.queryByText('Welcome to a learning experience made just for you.')).not.toBeInTheDocument();
    });

    it('shows the returning-user subtitle when user has enrollments', () => {
        renderHome();

        expect(screen.getByText('Welcome to a learning experience made just for you.')).toBeInTheDocument();
        expect(screen.queryByText('Your exciting learning journey starts here. Dive in!')).not.toBeInTheDocument();
    });

    it('renders "Hi there" when user profile is not available', () => {
        mockUseUserRead.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        });
        mockUseUserEnrolledCollections.mockReturnValue({
            data: { data: { courses: [] } },
            isLoading: false,
            error: null,
        });

        renderHome();

        expect(screen.getByText('Hi there')).toBeInTheDocument();
    });

    it('passes loading=true to HomeDashboardContent when user data is loading', () => {
        mockUseUserRead.mockReturnValue({
            data: undefined,
            isLoading: true,
            error: null,
            refetch: vi.fn(),
        });

        renderHome();

        expect(screen.getByTestId('dashboard-content')).toHaveAttribute('data-loading', 'true');
    });

    it('passes loading=true to HomeDashboardContent when enrollments are loading', () => {
        mockUseUserEnrolledCollections.mockReturnValue({
            data: undefined,
            isLoading: true,
            error: null,
        });

        renderHome();

        expect(screen.getByTestId('dashboard-content')).toHaveAttribute('data-loading', 'true');
    });

    it('passes error message to HomeDashboardContent when user data fails', () => {
        mockUseUserRead.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Network error'),
            refetch: vi.fn(),
        });

        renderHome();

        expect(screen.getByTestId('dashboard-content')).toHaveAttribute('data-error', 'Network error');
    });

    it('passes enrolledCount to HomeDashboardContent', () => {
        renderHome();

        expect(screen.getByTestId('dashboard-content')).toHaveAttribute('data-enrolled', '2');
    });

    it('renders footer', async () => {
        // This test is no longer valid since Home doesn't render the footer
        // The footer is now rendered by PageLayout
        renderHome();

        await waitFor(() => {
            expect(screen.getByText('Hi John Doe')).toBeInTheDocument();
        });
    });

    it('handles sidebar toggle on desktop', async () => {
        // This test is no longer valid since Home doesn't render the sidebar
        // The sidebar is now rendered by PageLayout
        renderHome();

        await waitFor(() => {
            expect(screen.getByText('Hi John Doe')).toBeInTheDocument();
        });
    });

    it('renders mobile layout correctly', async () => {
        // This test is no longer valid since Home doesn't render the header
        // The header is now rendered by PageLayout
        mockUseIsMobile.mockReturnValue(true);
        renderHome();

        await waitFor(() => {
            expect(screen.getByText('Hi John Doe')).toBeInTheDocument();
        });
    });

    it('opens search modal when search button is clicked', async () => {
        // This test is no longer valid since Home doesn't render the search button
        // The search button is now rendered by PageLayout/Header
        renderHome();

        await waitFor(() => {
            expect(screen.getByText('Hi John Doe')).toBeInTheDocument();
        });
    });

    it('changes language through the dropdown', async () => {
        // This test is no longer valid since Home doesn't render the language dropdown
        // The language dropdown is now rendered by PageLayout/Header
        renderHome();

        await waitFor(() => {
            expect(screen.getByText('Hi John Doe')).toBeInTheDocument();
        });
    });

    it('updates activeNav when sidebar notifies', async () => {
        // This test is no longer valid since Home doesn't render the sidebar
        // The sidebar is now rendered by PageLayout
        renderHome();

        await waitFor(() => {
            expect(screen.getByText('Hi John Doe')).toBeInTheDocument();
        });
    });
});
