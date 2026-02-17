import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HelpSupport from './HelpSupport';
import { useSystemSetting } from "@/hooks/useSystemSetting";

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
    default: ({ activeNav, onNavChange, collapsed, onToggle }: any) => (
        <div data-testid="home-sidebar" data-collapsed={collapsed}>
            <span data-testid="active-nav">{activeNav}</span>
            <button onClick={() => onNavChange('home')}>Change Nav</button>
            {onToggle && <button onClick={onToggle} aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}>Toggle Sidebar</button>}
        </div>
    ),
}));

vi.mock("@/components/landing/Accordion", () => ({
    Accordion: ({ children }: any) => <div data-testid="accordion">{children}</div>,
    AccordionItem: ({ children }: any) => <div data-testid="accordion-item">{children}</div>,
    AccordionTrigger: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    AccordionContent: ({ children }: any) => <div data-testid="accordion-content">{children}</div>,
}));

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: vi.fn(() => false),
}));

vi.mock("@/utils/sanitizeHtml", () => ({
    sanitizeHtml: (html: string) => html,
}));

// Mock useSystemSetting hook
vi.mock("@/hooks/useSystemSetting", () => ({
    useSystemSetting: vi.fn(),
}));

// Mock the shared hook
const mockUseHelpFaqData = vi.fn();
vi.mock("@/hooks/useFaqData", () => ({
    useHelpFaqData: (...args: any[]) => mockUseHelpFaqData(...args),
}));

const mockCategories = [
    {
        name: "Login",
        faqs: [
            { topic: "How do I login?", description: "Use your credentials to login." },
            { topic: "I forgot my password", description: "Click forgot password link." },
            { topic: "Can I use SSO?", description: "Yes, SSO is supported." },
        ],
    },
    {
        name: "Profile",
        faqs: [
            { topic: "How to update profile?", description: "Go to profile settings." },
            { topic: "Change avatar?", description: "Click on your avatar to change it." },
        ],
    },
    {
        name: "Course & Certificates",
        faqs: [
            { topic: "How to enroll?", description: "Click enroll on the course page." },
            { topic: "Download certificate?", description: "Go to profile > certificates." },
        ],
    },
];

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return { ...actual, useNavigate: () => mockNavigate };
});

describe('HelpSupport', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseHelpFaqData.mockReturnValue({ categories: mockCategories, loading: false, error: null });
        vi.mocked(useSystemSetting).mockReturnValue({
            data: { data: { response: { value: 'Test App' } } },
            isLoading: false,
        } as any);
    });

    it('renders the help & support page with dynamic categories and replaces app name', () => {
        const categoriesWithPlaceholder = [
            {
                name: "About {{APP_NAME}}",
                faqs: [{ topic: "T1", description: "D1" }]
            }
        ];
        mockUseHelpFaqData.mockReturnValue({ categories: categoriesWithPlaceholder, loading: false, error: null });

        render(
            <MemoryRouter initialEntries={['/help-support']}>
                <HelpSupport />
            </MemoryRouter>
        );

        expect(screen.getByText('About Test App')).toBeInTheDocument();
    });

    it('displays correct FAQ count for each category', () => {
        render(
            <MemoryRouter initialEntries={['/help-support']}>
                <HelpSupport />
            </MemoryRouter>
        );

        expect(screen.getByText('3 FAQs')).toBeInTheDocument();
        expect(screen.getAllByText('2 FAQs')).toHaveLength(2);
    });

    it('navigates to category detail when a category card is clicked', () => {
        render(
            <MemoryRouter initialEntries={['/help-support']}>
                <HelpSupport />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText('Login').closest('div')!);
        expect(mockNavigate).toHaveBeenCalledWith('/help-support/login');
    });

    it('shows loading state while data is being fetched', () => {
        mockUseHelpFaqData.mockReturnValue({ categories: [], loading: true, error: null });

        render(
            <MemoryRouter initialEntries={['/help-support']}>
                <HelpSupport />
            </MemoryRouter>
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows error state when fetch fails', () => {
        mockUseHelpFaqData.mockReturnValue({ categories: [], loading: false, error: new Error('fail') });

        render(
            <MemoryRouter initialEntries={['/help-support']}>
                <HelpSupport />
            </MemoryRouter>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('toggles sidebar state', () => {
        render(
            <MemoryRouter initialEntries={['/help-support']}>
                <HelpSupport />
            </MemoryRouter>
        );

        const sidebar = screen.getByTestId('home-sidebar');
        expect(sidebar).toBeInTheDocument();
        expect(sidebar).toHaveAttribute('data-collapsed', 'false');

        // Click Collapse
        const collapseBtn = screen.getByRole('button', { name: /Collapse Sidebar/i });
        fireEvent.click(collapseBtn);

        expect(sidebar).toHaveAttribute('data-collapsed', 'true');
        expect(screen.getByTestId('sidebar-status')).toHaveTextContent('Sidebar Closed'); // Header mock update

        // Click Expand (same button spot, new label)
        const expandBtn = screen.getByRole('button', { name: /Expand Sidebar/i });
        fireEvent.click(expandBtn);

        expect(sidebar).toHaveAttribute('data-collapsed', 'false');
        expect(screen.getByTestId('sidebar-status')).toHaveTextContent('Sidebar Open');
    });

    it('handles api error gracefully', () => {
        mockUseHelpFaqData.mockReturnValue({ categories: [], loading: false, error: { message: "Failed to fetch" } });
        render(
            <MemoryRouter initialEntries={['/help-support']}>
                <HelpSupport />
            </MemoryRouter>
        );
        expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
    });

    it('navigates to correct category on click', () => {
        render(
            <MemoryRouter initialEntries={['/help-support']}>
                <HelpSupport />
            </MemoryRouter>
        );
        const categoryCard = screen.getByText('Login');
        fireEvent.click(categoryCard);
        expect(mockNavigate).toHaveBeenCalledWith('/help-support/login');
    });
});
