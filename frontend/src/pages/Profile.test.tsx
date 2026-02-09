import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Profile from './Profile';

// Mock child components
vi.mock('@/components/HomeSidebar', () => ({
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
vi.mock('@/components/Footer', () => ({ default: () => <div data-testid="footer" /> }));
vi.mock('@/components/PageLoader', () => ({ default: () => <div>Loading...</div> }));

// Mock DropdownMenu to render content inline
vi.mock('@/components/dropdown-menu', () => ({
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
        <div onClick={onClick}>{children}</div>
    ),
}));

// Mock Sheet component
vi.mock('@/components/sheet', () => ({
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

describe('Profile Page', () => {
    beforeEach(() => {
        mockUseIsMobile.mockReturnValue(false); // Default to desktop
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const renderProfile = () => {
        return render(
            <BrowserRouter>
                <Profile />
            </BrowserRouter>
        );
    };

    it('renders the loading state and then the profile page', async () => {
        renderProfile();

        expect(screen.getByText('Loading...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        }, { timeout: 2000 });

        expect(screen.getByTestId('profile-card')).toBeInTheDocument();
        expect(screen.getByTestId('personal-info')).toBeInTheDocument();
        expect(screen.getByTestId('stats-cards')).toBeInTheDocument();
        expect(screen.getByTestId('learning-list')).toBeInTheDocument();
    });

    it('renders mobile layout and opens sidebar on button click', async () => {
        mockUseIsMobile.mockReturnValue(true);
        renderProfile();
        await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument(), { timeout: 2000 });

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
        await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument(), { timeout: 2000 });

        const searchBtns = screen.getAllByRole('button');
        const mobileSearchBtn = searchBtns.find(b => b.className.includes('profile-search-btn-mobile'));

        expect(mobileSearchBtn).toBeInTheDocument();
        fireEvent.click(mobileSearchBtn!);
        expect(mockNavigate).toHaveBeenCalledWith('/search');
    });
});
