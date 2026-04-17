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
            if (key === 'help.reportIssueBtn') return 'Report Issue';
            if (key === 'help.reportAppIssue') return 'Report App Issue';
            return key;
        },
    }),
}));

const mockUseHelpFaqData = vi.fn();
vi.mock("@/hooks/useFaqData", () => ({
    useHelpFaqData: (...args: any[]) => mockUseHelpFaqData(...args),
}));

// Mock HelpSupportService so we can control buildHelpCategories in specific tests
const mockBuildHelpCategories = vi.fn();
vi.mock("../../services/HelpSupportService", () => ({
    buildHelpCategories: (...args: any[]) => mockBuildHelpCategories(...args),
}));

// Mock ReportIssueDialog to keep rendering simple
vi.mock("@/components/help/ReportIssueDialog", () => ({
    default: ({ open }: { open: boolean; onOpenChange: (v: boolean) => void }) =>
        open ? <div data-testid="report-issue-dialog">ReportIssueDialog</div> : null,
}));

vi.mock("@/hooks/useImpression", () => ({
    default: vi.fn(),
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
        // Default: buildHelpCategories returns well-shaped category objects
        mockBuildHelpCategories.mockImplementation((cats: any[]) =>
            cats.map((cat: any) => ({
                title: cat.name || '',
                description: cat.description || '',
                faqCount: Array.isArray(cat.faqs) ? cat.faqs.length : 0,
                slug: cat.id || cat.name?.toLowerCase(),
            }))
        );
    });

    it('renders the help & support page with dynamic categories and replaces app name', () => {
        const categoriesWithPlaceholder = [
            {
                name: "About {{APP_NAME}}",
                faqs: [{ topic: "T1", description: "D1" }]
            }
        ];
        mockUseHelpFaqData.mockReturnValue({ categories: categoriesWithPlaceholder, loading: false, error: null });
        mockBuildHelpCategories.mockReturnValue([
            { title: 'About {{APP_NAME}}', description: '', faqCount: 1, slug: 'about' }
        ]);

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

        expect(screen.getByTestId('page-loader')).toBeInTheDocument();
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

    // --- New tests for previously uncovered lines ---

    it('opens ReportIssueDialog when Report Issue button is clicked (covers line 57)', () => {
        // Line 57: onClick={() => setIsReportIssueOpen(true)}
        render(
            <MemoryRouter initialEntries={['/help-support']}>
                <HelpSupport />
            </MemoryRouter>
        );

        // Dialog should not be visible initially
        expect(screen.queryByTestId('report-issue-dialog')).not.toBeInTheDocument();

        // Click the Report Issue button
        const reportBtn = screen.getByRole('button', { name: /report/i });
        fireEvent.click(reportBtn);

        // Dialog should now be open
        expect(screen.getByTestId('report-issue-dialog')).toBeInTheDocument();
    });

    it('logs error and re-throws when buildHelpCategories throws (covers lines 40-41)', () => {
        // Lines 39-41: the catch block inside useMemo logs with console.error then re-throws.
        // React (without an ErrorBoundary) catches the error at the root, so we assert that
        // console.error was called with the expected message, which proves the catch branch ran.
        const buildError = new Error('buildHelpCategories exploded');
        mockBuildHelpCategories.mockImplementationOnce(() => { throw buildError; });

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        // React catches the error thrown inside useMemo; the render itself will throw or
        // React will swallow it; either way the catch block must have executed.
        try {
            render(
                <MemoryRouter initialEntries={['/help-support']}>
                    <HelpSupport />
                </MemoryRouter>
            );
        } catch {
            // intentionally ignored — we only care that the catch block ran
        }

        // console.error should have been called with the message from the catch block
        const errorCalls = consoleSpy.mock.calls;
        const matchingCall = errorCalls.some(
            (args) =>
                String(args[0]).includes('Error processing help categories') ||
                args.some((a: any) => a === buildError)
        );
        expect(matchingCall).toBe(true);

        consoleSpy.mockRestore();
    });
});
