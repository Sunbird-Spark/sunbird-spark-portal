import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useParams } from 'react-router-dom';
import HelpCategoryDetail from './HelpCategoryDetail';
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
            {onToggle && (
                <button
                    onClick={onToggle}
                    aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    Toggle Sidebar
                </button>
            )}
        </div>
    ),
}));

vi.mock("@/components/landing/Accordion", () => ({
    Accordion: ({ children }: any) => <div data-testid="accordion">{children}</div>,
    AccordionItem: ({ children }: any) => <div data-testid="accordion-item">{children}</div>,
    AccordionTrigger: ({ children }: any) => <button>{children}</button>,
    AccordionContent: ({ children }: any) => <div data-testid="accordion-content">{children}</div>,
}));

vi.mock("@/hooks/use-mobile", () => ({
    useIsMobile: vi.fn(() => false),
}));

vi.mock("@/utils/sanitizeHtml", () => ({
    sanitizeHtml: (html: string) => html,
}));

// Mock FAQ hook
const mockUseHelpFaqData = vi.fn();
vi.mock("@/hooks/useFaqData", () => ({
    useHelpFaqData: (...args: any[]) => mockUseHelpFaqData(...args),
}));

// Mock system setting
vi.mock("@/hooks/useSystemSetting", () => ({
    useSystemSetting: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: vi.fn(() => ({ categoryId: 'login' })),
    };
});

const mockCategories = [
    {
        name: "Login",
        faqs: [
            { topic: "How do I create an account?", description: "Register using your email or phone." },
            { topic: "I forgot my password", description: "Click forgot password on login page." },
        ],
    },
];

describe('HelpCategoryDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockUseHelpFaqData.mockReturnValue({
            categories: mockCategories,
            loading: false,
            error: null
        });

        vi.mocked(useParams).mockReturnValue({ categoryId: 'login' });

        vi.mocked(useSystemSetting).mockReturnValue({
            data: { data: { response: { value: 'Test App' } } },
            isLoading: false,
        } as any);
    });

    it('renders category FAQs and replaces app name placeholders', async () => {
        const categoriesWithPlaceholder = [
            {
                name: "About {{APP_NAME}}",
                faqs: [
                    { topic: "What is {{APP_NAME}}?", description: "Welcome to {{APP_NAME}}" }
                ]
            }
        ];

        mockUseHelpFaqData.mockReturnValue({
            categories: categoriesWithPlaceholder,
            loading: false,
            error: null
        });

        vi.mocked(useParams).mockReturnValue({ categoryId: 'about-app-name' });

        render(
            <MemoryRouter initialEntries={['/help-support/about-app-name']}>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText("About Test App FAQs")).toBeInTheDocument();
            expect(screen.getByText("What is Test App?")).toBeInTheDocument();
            expect(screen.getByText("Welcome to Test App")).toBeInTheDocument();
        });
    });

    it('navigates back when Go Back is clicked', () => {
        render(
            <MemoryRouter>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText('Go Back'));
        expect(mockNavigate).toHaveBeenCalledWith('/help-support');
    });

    it('toggles sidebar collapse/expand', () => {
        render(
            <MemoryRouter>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        const sidebar = screen.getByTestId('home-sidebar');
        expect(sidebar).toHaveAttribute('data-collapsed', 'false');

        fireEvent.click(screen.getByRole('button', { name: "Collapse Sidebar" }));
        expect(sidebar).toHaveAttribute('data-collapsed', 'true');
        expect(screen.getByTestId('sidebar-status')).toHaveTextContent('Sidebar Closed');

        fireEvent.click(screen.getByRole('button', { name: "Expand Sidebar" }));
        expect(sidebar).toHaveAttribute('data-collapsed', 'false');
        expect(screen.getByTestId('sidebar-status')).toHaveTextContent('Sidebar Open');
    });

    it('handles feedback submission (Yes)', async () => {
        render(
            <MemoryRouter>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        fireEvent.click(screen.getAllByText('Yes')[0]!);

        await waitFor(() => {
            expect(screen.getAllByText('Thank you for your feedback!')[0]!).toBeInTheDocument();
        });
    });

    it('handles feedback submission (No) with text input', async () => {
        render(
            <MemoryRouter>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        fireEvent.click(screen.getAllByText('No')[0]!);

        fireEvent.change(
            screen.getByPlaceholderText('Type Here...'),
            { target: { value: 'Needs more details' } }
        );

        fireEvent.click(screen.getByText('Submit feedback'));

        await waitFor(() => {
            expect(screen.getAllByText('Thank you for your feedback!')[0]!).toBeInTheDocument();
        });
    });

    it('disables submit button when feedback is empty', () => {
        render(
            <MemoryRouter>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        fireEvent.click(screen.getAllByText('No')[0]!);
        expect(screen.getByText('Submit feedback')).toBeDisabled();

        fireEvent.change(
            screen.getByPlaceholderText('Type Here...'),
            { target: { value: 'Some feedback' } }
        );

        expect(screen.getByText('Submit feedback')).not.toBeDisabled();
    });

    it('shows loading state', () => {
        mockUseHelpFaqData.mockReturnValue({
            categories: [],
            loading: true,
            error: null
        });

        render(
            <MemoryRouter>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows error state when fetch fails', () => {
        mockUseHelpFaqData.mockReturnValue({
            categories: [],
            loading: false,
            error: new Error('fail')
        });

        render(
            <MemoryRouter>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('shows error when category is not found', () => {
        vi.mocked(useParams).mockReturnValue({ categoryId: 'invalid-id' });

        render(
            <MemoryRouter>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        expect(screen.getByText('Category not found.')).toBeInTheDocument();
    });
});
