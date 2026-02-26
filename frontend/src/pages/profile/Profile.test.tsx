import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Profile from './Profile';

// Mock child components
vi.mock('@/components/home/HomeSidebar', () => ({
    default: ({ onNavChange }: { onNavChange: (n: string) => void }) => (
        <div data-testid="sidebar">
            <button onClick={() => onNavChange('profile')}>Change Nav</button>
        </div>
    )
}));
vi.mock('@/components/profile/ProfileCard', () => ({ default: () => <div data-testid="profile-card" /> }));
vi.mock('@/components/profile/PersonalInformation', () => ({ default: () => <div data-testid="personal-info" /> }));
vi.mock('@/components/profile/ProfileStatsCards', () => ({ default: () => <div data-testid="stats-cards" /> }));
vi.mock('@/components/profile/ProfileLearningList', () => ({ default: () => <div data-testid="learning-list" /> }));
vi.mock('@/components/home/Footer', () => ({ default: () => <div data-testid="footer" /> }));
vi.mock('@/components/common/PageLoader', () => ({ default: () => <div>Loading...</div> }));

vi.mock('@/components/common/SearchModal', () => ({
    default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
        isOpen ? <div data-testid="search-modal">Search Modal<button onClick={onClose}>Close</button></div> : null,
}));

// Mock DropdownMenu to render content inline
vi.mock('@/components/common/DropdownMenu', () => ({
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
        <div onClick={onClick}>{children}</div>
    ),
}));

// Mock Sheet component
vi.mock('@/components/home/Sheet', () => ({
    Sheet: ({ children, open }: { children: React.ReactNode, open: boolean }) => open ? <div data-testid="sheet">{children}</div> : null,
    SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
        t: (key: string) => {
            const translations: Record<string, string> = {
                'profilePage.loading': 'Loading...',
                'profilePage.errorLoading': 'Error loading profile...',
                'navigationMenu': 'Navigation Menu',
                'homeComponents.openMenu': 'Open Menu',
                'header.search': 'Search',
                'changeLanguage': 'Change Language',
                'common.notifications': 'Notifications',
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

// Mock useAuth
vi.mock('@/auth/AuthContext', () => ({
    useAuth: vi.fn(() => ({
        isAuthenticated: true,
        user: { id: '75a0d064-b41a-4ff8-ac22-38611acbddfe', name: 'Chetann Test0r8', role: 'student' },
        login: vi.fn(),
        logout: vi.fn(),
    })),
}));

// Mock useUserRead hook
const mockUserData = {
    id: '75a0d064-b41a-4ff8-ac22-38611acbddfe',
    identifier: '75a0d064-b41a-4ff8-ac22-38611acbddfe',
    firstName: 'Chetann',
    lastName: 'Test0r8',
    email: 'user@yopmail.com',
    maskedEmail: 'us****************@yopmail.com',
    phone: '1234567890',
    maskedPhone: null,
    userName: 'user_1770717393784@yopmail.com',
    dob: '2001-12-31',
    channel: 'sunbird',
    rootOrgId: '0144880972895272960',
    status: 0,
    isDeleted: false,
    profileUserTypes: [{ type: 'student' }],
    profileLocation: [
        { id: '692b97c7-c166-4f31-92e1-b4c1d25dea50', type: 'district' },
        { id: '7758262b-884a-447e-90ae-23a0153de1bf', type: 'state' }
    ],
    organisations: [],
    roles: [],
};

vi.mock('@/hooks/useUserRead', () => ({
    useUserRead: () => ({
        data: {
            data: {
                response: mockUserData
            }
        },
        isLoading: false,
        isError: false,
    }),
}));

describe('Profile Page', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        mockUseIsMobile.mockReturnValue(false); // Default to desktop
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const renderProfile = () => {
        return render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={['/profile']}>
                    <Profile />
                </MemoryRouter>
            </QueryClientProvider>
        );
    };

    it('renders the loading state and then the profile page', async () => {
        renderProfile();

        // With mocked data, the profile should render immediately
        expect(screen.getByTestId('profile-card')).toBeInTheDocument();
        expect(screen.getByTestId('personal-info')).toBeInTheDocument();
        expect(screen.getByTestId('stats-cards')).toBeInTheDocument();
        expect(screen.getByTestId('learning-list')).toBeInTheDocument();
    });

    it('renders mobile layout and opens sidebar on button click', async () => {
        mockUseIsMobile.mockReturnValue(true);
        renderProfile();

        const menuBtn = screen.getByLabelText('Open Menu');
        expect(menuBtn).toBeInTheDocument();

        // Before click, sheet should not be visible in mocks
        expect(screen.queryByTestId('sheet')).not.toBeInTheDocument();

        fireEvent.click(menuBtn);

        // After click, sheet should be visible
        expect(screen.getByTestId('sheet')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('navigates to search on mobile', async () => {
        mockUseIsMobile.mockReturnValue(true);
        renderProfile();

        const mobileSearchBtn = screen.getByRole('button', { name: /search/i });

        expect(mobileSearchBtn).toBeInTheDocument();
        fireEvent.click(mobileSearchBtn);

        // SearchModal should open instead of navigating
        expect(screen.getByTestId('search-modal')).toBeInTheDocument();
    });
});
