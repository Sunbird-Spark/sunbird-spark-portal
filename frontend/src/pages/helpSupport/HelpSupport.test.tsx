import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HelpSupport from './HelpSupport';

// Mock sub-components
vi.mock("@/components/home/Header", () => ({
    default: ({ isSidebarOpen, onToggleSidebar }: any) => (
        <header data-testid="mock-header">
            <button onClick={onToggleSidebar} aria-label="Toggle Sidebar">Toggle</button>
            <div data-testid="sidebar-status">{isSidebarOpen ? "Sidebar Open" : "Sidebar Closed"}</div>
        </header>
    ),
}));

vi.mock("@/components/home/Footer", () => ({
    default: () => <footer data-testid="mock-footer" />,
}));

vi.mock("@/components/home/HomeSidebar", () => ({
    default: ({ activeNav, onNavChange }: any) => (
        <div data-testid="home-sidebar">
            <span data-testid="active-nav">{activeNav}</span>
            <button onClick={() => onNavChange('home')}>Change Nav</button>
        </div>
    ),
}));

// Mock Accordion to avoid Radix UI issues in tests
vi.mock("@/components/landing/Accordion", () => ({
    Accordion: ({ children }: any) => <div data-testid="accordion">{children}</div>,
    AccordionItem: ({ children }: any) => <div data-testid="accordion-item">{children}</div>,
    AccordionTrigger: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    AccordionContent: ({ children }: any) => <div data-testid="accordion-content">{children}</div>,
}));

// Mock hooks
vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: vi.fn(() => false),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('HelpSupport', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const waitForLoading = async () => {
        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        }, { timeout: 5000 });
    };

    it('renders the help & support page after loading', async () => {
        render(
            <MemoryRouter initialEntries={['/help-support']}>
                <HelpSupport />
            </MemoryRouter>
        );

        await waitForLoading();

        expect(screen.getByText('How can we assist you today?')).toBeInTheDocument();
        expect(screen.getByTestId('mock-header')).toBeInTheDocument();
        expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    });

    it('navigates to category detail when a category card is clicked', async () => {
        render(
            <MemoryRouter initialEntries={['/help-support']}>
                <HelpSupport />
            </MemoryRouter>
        );

        await waitForLoading();

        const loginCategory = screen.getByText('Login');
        fireEvent.click(loginCategory.closest('div')!);

        expect(mockNavigate).toHaveBeenCalledWith('/help-support/login');
    });

    it('displays FAQ content (mocked accordion)', async () => {
        render(
            <MemoryRouter initialEntries={['/help-support']}>
                <HelpSupport />
            </MemoryRouter>
        );

        await waitForLoading();

        // In the mock, content is always rendered in the DOM, just structure
        // Verify question exists
        expect(screen.getByText('What kind of courses are available on this platform?')).toBeInTheDocument();

        // Verify answer exists (mock accordion renders children)
        expect(screen.getByText(/Lorem ipsum is placeholder text/)).toBeInTheDocument();
    });

    it('toggles sidebar state', async () => {
        render(
            <MemoryRouter initialEntries={['/help-support']}>
                <HelpSupport />
            </MemoryRouter>
        );

        await waitForLoading();

        // Initially sidebar is open
        expect(screen.getByTestId('sidebar-status')).toHaveTextContent('Sidebar Open');
        expect(screen.getByTestId('home-sidebar')).toBeInTheDocument();

        // Close sidebar using Close button
        const closeBtn = screen.getByRole('button', { name: /close sidebar/i });
        fireEvent.click(closeBtn);

        await waitFor(() => {
            expect(screen.getByTestId('sidebar-status')).toHaveTextContent('Sidebar Closed');
        });
        expect(screen.queryByTestId('home-sidebar')).not.toBeInTheDocument();

        // Open sidebar using Toggle button in header
        const toggleBtn = screen.getByLabelText('Toggle Sidebar');
        fireEvent.click(toggleBtn);

        await waitFor(() => {
            expect(screen.getByTestId('sidebar-status')).toHaveTextContent('Sidebar Open');
        });
        expect(screen.getByTestId('home-sidebar')).toBeInTheDocument();
    });
});
