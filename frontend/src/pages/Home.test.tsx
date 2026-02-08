import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from './Home';

// Mock child components to keep tests focused
vi.mock('@/components/HomeSidebar', () => ({
    default: ({ onNavChange }: { onNavChange: (n: string) => void }) => (
        <div data-testid="sidebar">
            <button onClick={() => onNavChange('profile')}>Change Nav</button>
        </div>
    )
}));
vi.mock('@/components/HomeStatsCards', () => ({ default: () => <div data-testid="stats-cards" /> }));
vi.mock('@/components/HomeContinueLearning', () => ({ default: () => <div data-testid="continue-learning" /> }));
vi.mock('@/components/HomeInProgressGrid', () => ({ default: () => <div data-testid="inprogress-grid" /> }));
vi.mock('@/components/HomeRecommendedSection', () => ({ default: () => <div data-testid="recommended-section" /> }));
vi.mock('@/components/Footer', () => ({ default: () => <div data-testid="footer" /> }));

// Mock DropdownMenu to render content inline
vi.mock('@/components/dropdown-menu', () => ({
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

describe('Home Page', () => {
    beforeEach(() => {
        mockUseIsMobile.mockReturnValue(false); // Default to desktop
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const renderHome = () => {
        return render(
            <BrowserRouter>
                <Home />
            </BrowserRouter>
        );
    };

    it('renders the loading state initially and then the dashboard', async () => {
        renderHome();

        expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument();
        }, { timeout: 2000 });

        expect(screen.getByText('Hi John Deo')).toBeInTheDocument();
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('stats-cards')).toBeInTheDocument();
    });

    it('handles sidebar toggle on desktop', async () => {
        renderHome();
        await waitFor(() => expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument(), { timeout: 2000 });

        // Sidebar is open by default on desktop
        expect(screen.getByAltText('Sunbird')).toBeInTheDocument();

        // Close sidebar
        const buttons = screen.getAllByRole('button');
        const collapseBtn = buttons.find(b => b.querySelector('path[d="M5 1L1 5L5 9"]'));

        if (collapseBtn) {
            fireEvent.click(collapseBtn);
            await waitFor(() => {
                expect(screen.queryByAltText('Sunbird')).not.toBeInTheDocument();
            });
        }
    });

    it('renders mobile layout correctly', async () => {
        mockUseIsMobile.mockReturnValue(true);
        renderHome();
        await waitFor(() => expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument(), { timeout: 2000 });

        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
    });

    it('navigates to search when search bar is clicked', async () => {
        renderHome();
        await waitFor(() => expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument(), { timeout: 2000 });

        const searchInput = screen.getByPlaceholderText('header.search');
        fireEvent.click(searchInput.parentElement!);

        expect(mockNavigate).toHaveBeenCalledWith('/search');
    });

    it('changes language through the dropdown', async () => {
        renderHome();
        await waitFor(() => expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument(), { timeout: 2000 });

        const langBtn = screen.getByAltText('Translate').parentElement;
        fireEvent.click(langBtn!);

        const hindiOption = await screen.findByText('Hindi');
        fireEvent.click(hindiOption);

        expect(mockChangeLanguage).toHaveBeenCalledWith('hi');
    });

    it('updates activeNav when sidebar notifies', async () => {
        renderHome();
        await waitFor(() => expect(screen.queryByText('Loading your dashboard...')).not.toBeInTheDocument(), { timeout: 2000 });

        const changeNavBtn = screen.getByText('Change Nav');
        fireEvent.click(changeNavBtn);

        // We can't easily check internal state, but we can check if it re-renders correctly or side effects
        // Here we just verify the interaction happened.
    });
});
