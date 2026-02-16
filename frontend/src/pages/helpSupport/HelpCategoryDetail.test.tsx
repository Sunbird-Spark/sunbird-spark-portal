import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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

// Mock Accordion
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
        useParams: () => ({ categoryId: 'login' }),
    };
});

describe('HelpCategoryDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const waitForLoading = async () => {
        await waitFor(() => {
            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        }, { timeout: 5000 });
    };

    it('renders the category detail page after loading', async () => {
        render(
            <MemoryRouter initialEntries={['/help-support/login']}>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        await waitForLoading();

        expect(screen.getByText("Login FAQs")).toBeInTheDocument();
        expect(screen.getByText('Go Back')).toBeInTheDocument();
    });

    it('navigates back when Go Back is clicked', async () => {
        render(
            <MemoryRouter initialEntries={['/help-support/login']}>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        await waitForLoading();

        const goBackBtn = screen.getByText('Go Back');
        fireEvent.click(goBackBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/help-support');
    });

    it('handles feedback submission (Yes)', async () => {
        render(
            <MemoryRouter initialEntries={['/help-support/login']}>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        await waitForLoading();

        // FAQ content is rendered by mock
        const yesBtn = screen.getAllByText('Yes')[0]!; // since multiple faqs exist
        fireEvent.click(yesBtn);

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

        await waitForLoading();

        const noBtn = screen.getAllByText('No')[0]!;
        fireEvent.click(noBtn);

        expect(screen.getByText('Sorry about that!')).toBeInTheDocument();
        const textarea = screen.getByPlaceholderText('Type Here...');
        expect(textarea).toBeInTheDocument();

        // Type feedback
        fireEvent.change(textarea, { target: { value: 'This is not helpful' } });

        // Submit feedback
        const submitBtn = screen.getByText('Submit feedback');
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getAllByText('Thank you for your feedback!')[0]).toBeInTheDocument();
        });
    });

    it('disables submit button when feedback text is empty', async () => {
        render(
            <MemoryRouter initialEntries={['/help-support/login']}>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        await waitForLoading();

        const noBtn = screen.getAllByText('No')[0]!;
        fireEvent.click(noBtn);

        const submitBtn = screen.getByText('Submit feedback');
        expect(submitBtn).toBeDisabled();

        // Type something
        const textarea = screen.getByPlaceholderText('Type Here...');
        fireEvent.change(textarea, { target: { value: 'Some feedback' } });
        expect(submitBtn).not.toBeDisabled();
    });
});
