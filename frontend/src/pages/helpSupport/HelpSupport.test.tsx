import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HelpSupport from './HelpSupport';
import { useSystemSetting } from "@/hooks/useSystemSetting";

vi.mock("@/components/landing/Accordion", () => ({
    Accordion: ({ children }: any) => <div data-testid="accordion">{children}</div>,
    AccordionItem: ({ children }: any) => <div data-testid="accordion-item">{children}</div>,
    AccordionTrigger: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    AccordionContent: ({ children }: any) => <div data-testid="accordion-content">{children}</div>,
}));

vi.mock("@/utils/sanitizeHtml", () => ({
    sanitizeHtml: (html: string) => html,
}));

vi.mock("@/hooks/useSystemSetting", () => ({
    useSystemSetting: vi.fn(),
}));

vi.mock("@/hooks/useAppI18n", () => ({
    useAppI18n: () => ({
        t: (key: string, options?: any) => {
            if (key === 'help.faqCount') return `${options?.count} FAQs`;
            if (key === 'loading') return 'Loading...';
            if (key === 'help.failedToLoadFaq') return 'Something went wrong';
            if (key === 'help.assistPrompt') return 'How can we assist you today?';
            if (key === 'somethingWentWrong') return 'Something went wrong';
            return key;
        },
    }),
}));

const mockUseHelpFaqData = vi.fn();
vi.mock("@/hooks/useFaqData", () => ({
    useHelpFaqData: (...args: any[]) => mockUseHelpFaqData(...args),
}));

const mockCategories = [
    {
        id: "login",
        name: "Login",
        faqs: [
            { topic: "How do I login?", description: "Use your credentials to login." },
            { topic: "I forgot my password", description: "Click forgot password link." },
            { topic: "Can I use SSO?", description: "Yes, SSO is supported." },
        ],
    },
    {
        id: "profile",
        name: "Profile",
        faqs: [
            { topic: "How to update profile?", description: "Go to profile settings." },
            { topic: "Change avatar?", description: "Click on your avatar to change it." },
        ],
    },
    {
        id: "course_certificates",
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
