import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useParams } from 'react-router-dom';
import HelpCategoryDetail from './HelpCategoryDetail';

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

// Mock the shared hook
const mockUseHelpFaqData = vi.fn();
vi.mock("@/hooks/useHelpFaqData", () => ({
    useHelpFaqData: (...args: any[]) => mockUseHelpFaqData(...args),
}));

const mockCategories = [
    {
        name: "Login",
        faqs: [
            { topic: "How do I create an account?", description: "Register using your email or phone." },
            { topic: "I forgot my password", description: "Click forgot password on login page." },
            { topic: "Can I use Google login?", description: "Yes, Google login is supported." },
        ],
    },
    {
        name: "Profile",
        faqs: [
            { topic: "How to update profile?", description: "Go to profile settings." },
        ],
    },
];

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: vi.fn(() => ({ categoryId: 'login' })),
    };
});

describe('HelpCategoryDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseHelpFaqData.mockReturnValue({ categories: mockCategories, loading: false, error: null });
        vi.mocked(useParams).mockReturnValue({ categoryId: 'login' });
    });

    it('renders the category detail page with FAQs from API', () => {
        render(
            <MemoryRouter initialEntries={['/help-support/login']}>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        expect(screen.getByText("Login FAQs")).toBeInTheDocument();
        expect(screen.getByText('Go Back')).toBeInTheDocument();
        expect(screen.getByText('How do I create an account?')).toBeInTheDocument();
        expect(screen.getByText('I forgot my password')).toBeInTheDocument();
        expect(screen.getByText('Can I use Google login?')).toBeInTheDocument();
    });

    it('navigates back when Go Back is clicked', () => {
        render(
            <MemoryRouter initialEntries={['/help-support/login']}>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText('Go Back'));
        expect(mockNavigate).toHaveBeenCalledWith('/help-support');
    });

    it('handles feedback submission (Yes)', async () => {
        render(
            <MemoryRouter initialEntries={['/help-support/login']}>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        fireEvent.click(screen.getAllByText('Yes')[0]!);

        await waitFor(() => {
            expect(screen.getAllByText('Thank you for your feedback!')[0]).toBeInTheDocument();
        });
    });

    it('handles feedback submission (No) with text feedback', async () => {
        render(
            <MemoryRouter initialEntries={['/help-support/login']}>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        fireEvent.click(screen.getAllByText('No')[0]!);
        expect(screen.getByText('Sorry about that!')).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('Type Here...'), { target: { value: 'This is not helpful' } });
        fireEvent.click(screen.getByText('Submit feedback'));

        await waitFor(() => {
            expect(screen.getAllByText('Thank you for your feedback!')[0]).toBeInTheDocument();
        });
    });

    it('disables submit button when feedback text is empty', () => {
        render(
            <MemoryRouter initialEntries={['/help-support/login']}>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        fireEvent.click(screen.getAllByText('No')[0]!);
        expect(screen.getByText('Submit feedback')).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText('Type Here...'), { target: { value: 'Some feedback' } });
        expect(screen.getByText('Submit feedback')).not.toBeDisabled();
    });

    it('shows loading state while data is being fetched', () => {
        mockUseHelpFaqData.mockReturnValue({ categories: [], loading: true, error: null });

        render(
            <MemoryRouter initialEntries={['/help-support/login']}>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows error state when fetch fails', () => {
        mockUseHelpFaqData.mockReturnValue({ categories: [], loading: false, error: new Error('fail') });

        render(
            <MemoryRouter initialEntries={['/help-support/login']}>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
    it('shows error when category is not found', async () => {
        const { useParams } = await import("react-router-dom");
        vi.mocked(useParams).mockReturnValue({ categoryId: 'invalid-id' });

        render(
            <MemoryRouter initialEntries={['/help-support/invalid-id']}>
                <HelpCategoryDetail />
            </MemoryRouter>
        );
        expect(screen.getByText('Category not found.')).toBeInTheDocument();
    });

    it('handles successful feedback submission', async () => {
        const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({})
        } as Response);

        render(
            <MemoryRouter initialEntries={['/help-support/login']}>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        const yesButtons = screen.getAllByText('Yes');
        const firstYesButton = yesButtons[0];
        if (firstYesButton) {
            fireEvent.click(firstYesButton);
        }

        await waitFor(() => {
            expect(screen.getByText('Thank you for your feedback!')).toBeInTheDocument();
        });

        // Check if fetch was called with correct params
        expect(fetchSpy).toHaveBeenCalledWith("/api/help-support/feedback", expect.objectContaining({
            method: "POST",
            body: expect.stringContaining('"wasHelpful":true')
        }));
    });
});
