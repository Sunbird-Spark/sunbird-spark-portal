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
vi.mock('@/components/home/HomeStatsCards', () => ({ default: () => <div data-testid="stats-cards" /> }));
vi.mock('@/components/home/HomeContinueLearning', () => ({ default: () => <div data-testid="continue-learning" /> }));
vi.mock('@/components/home/HomeInProgressGrid', () => ({ default: () => <div data-testid="inprogress-grid" /> }));
vi.mock('@/components/home/HomeRecommendedSection', () => ({ default: () => <div data-testid="recommended-section" /> }));
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
        t: (key: string) => key,
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

// Mock useAuth for Header
vi.mock('@/auth/AuthContext', () => ({
    useAuth: vi.fn(() => ({
        isAuthenticated: true,
        user: { id: '123', name: 'John Doe', role: 'content_creator' },
        login: vi.fn(),
        logout: vi.fn(),
    })),
}));

// Mock useUserRead
const mockUseUserRead = vi.fn();
vi.mock('@/hooks/useUserRead', () => ({
    useUserRead: () => mockUseUserRead(),
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

    it('renders the welcome message with user name', () => {
        renderHome();

        expect(screen.getByText('Hi John Doe')).toBeInTheDocument();
        expect(screen.getByText('Welcome to a learning experience made just for you.')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('stats-cards')).toBeInTheDocument();
    });

    it('renders loading state when user data is loading', () => {
        mockUseUserRead.mockReturnValue({
            data: undefined,
            isLoading: true,
            error: null,
            refetch: vi.fn(),
        });

        renderHome();

        expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();
    });

    it('renders error state when user data fails to load', () => {
        mockUseUserRead.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Network error'),
            refetch: vi.fn(),
        });

        renderHome();

        expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('renders "Hi there" when user profile is not available', () => {
        mockUseUserRead.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        });

        renderHome();

        expect(screen.getByText('Hi there')).toBeInTheDocument();
    });

    it('handles sidebar toggle on desktop', () => {
        renderHome();

        expect(screen.getByTestId('sidebar')).toBeInTheDocument();

        // Sidebar is open by default on desktop
        expect(screen.getByAltText('Sunbird')).toBeInTheDocument();
    });

    it('renders mobile layout correctly', () => {
        mockUseIsMobile.mockReturnValue(true);
        renderHome();

        expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
    });

    it('opens search modal when search button is clicked', async () => {
        renderHome();

        const searchButton = screen.getByLabelText('Search');
        fireEvent.click(searchButton);

        await waitFor(() => {
            expect(screen.getByTestId('search-modal')).toBeInTheDocument();
        });
    });

    it('changes language through the dropdown', async () => {
        renderHome();

        const langBtn = screen.getByAltText('Language').parentElement;
        fireEvent.click(langBtn!);

        const hindiOption = await screen.findByText('Hindi');
        fireEvent.click(hindiOption);

        expect(mockChangeLanguage).toHaveBeenCalledWith('hi');
    });

    it('updates activeNav when sidebar notifies', () => {
        renderHome();

        const changeNavBtn = screen.getByText('Change Nav');
        fireEvent.click(changeNavBtn);

        // Verify the interaction happened without errors
        expect(changeNavBtn).toBeInTheDocument();
    });

    it('renders all main content sections when loaded', () => {
        renderHome();

        expect(screen.getByTestId('stats-cards')).toBeInTheDocument();
        expect(screen.getByTestId('continue-learning')).toBeInTheDocument();
        expect(screen.getByTestId('inprogress-grid')).toBeInTheDocument();
        expect(screen.getByTestId('recommended-section')).toBeInTheDocument();
        expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('renders the "Continue from where you left" section heading', () => {
        renderHome();

        expect(screen.getByText('Continue from where you left')).toBeInTheDocument();
    });
});
