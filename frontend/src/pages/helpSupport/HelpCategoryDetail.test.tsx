import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useParams } from 'react-router-dom';
import HelpCategoryDetail from './HelpCategoryDetail';
import { useSystemSetting } from "@/hooks/useSystemSetting";

vi.mock("@/components/landing/Accordion", () => ({
    Accordion: ({ children }: any) => <div data-testid="accordion">{children}</div>,
    AccordionItem: ({ children }: any) => <div data-testid="accordion-item">{children}</div>,
    AccordionTrigger: ({ children }: any) => <button>{children}</button>,
    AccordionContent: ({ children }: any) => <div data-testid="accordion-content">{children}</div>,
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

vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('@/hooks/usePermission', () => ({
    usePermissions: () => ({
        roles: ['PUBLIC'],
        isLoading: false,
        isAuthenticated: false,
        error: null,
        hasAnyRole: vi.fn(() => false),
        canAccessFeature: vi.fn(() => false),
        refetch: vi.fn(),
    }),
}));

vi.mock('@/hooks/useTnc', () => ({
    useGetTncUrl: () => ({ data: '' }),
    useAcceptTnc: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
    default: {
        getUserId: () => 'test-user-id',
        isUserAuthenticated: () => true,
        getAuthInfo: vi.fn().mockResolvedValue({
            sid: 'test-session',
            uid: 'test-user-id',
            isAuthenticated: true,
        }),
    },
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
        id: "login",
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

        fireEvent.click(screen.getByText('button.goBack'));
        expect(mockNavigate).toHaveBeenCalledWith('/help-support');
    });

    it('handles feedback submission (Yes)', async () => {
        render(
            <MemoryRouter>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        fireEvent.click(screen.getAllByText('yes')[0]!);

        await waitFor(() => {
            expect(screen.getAllByText('help.feedbackThanks')[0]!).toBeInTheDocument();
        });
    });

    it('handles feedback submission (No) with text input', async () => {
        render(
            <MemoryRouter>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        fireEvent.click(screen.getAllByText('no')[0]!);

        fireEvent.change(
            screen.getByPlaceholderText('help.typeHere'),
            { target: { value: 'Needs more details' } }
        );

        fireEvent.click(screen.getByText('help.submitFeedback'));

        await waitFor(() => {
            expect(screen.getAllByText('help.feedbackThanks')[0]!).toBeInTheDocument();
        });
    });

    it('disables submit button when feedback is empty', () => {
        render(
            <MemoryRouter>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        fireEvent.click(screen.getAllByText('no')[0]!);
        expect(screen.getByText('help.submitFeedback')).toBeDisabled();

        fireEvent.change(
            screen.getByPlaceholderText('help.typeHere'),
            { target: { value: 'Some feedback' } }
        );

        expect(screen.getByText('help.submitFeedback')).not.toBeDisabled();
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

        expect(screen.getByText('loading')).toBeInTheDocument();
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

        expect(screen.getByText('somethingWentWrong')).toBeInTheDocument();
    });

    it('shows error when category is not found', () => {
        vi.mocked(useParams).mockReturnValue({ categoryId: 'invalid-id' });

        render(
            <MemoryRouter>
                <HelpCategoryDetail />
            </MemoryRouter>
        );

        expect(screen.getByText('help.categoryNotFound')).toBeInTheDocument();
    });
});
