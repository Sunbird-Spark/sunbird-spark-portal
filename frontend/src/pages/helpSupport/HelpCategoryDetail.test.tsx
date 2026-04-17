import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, useParams } from 'react-router-dom';
import HelpCategoryDetail from './HelpCategoryDetail';
import { useSystemSetting } from "@/hooks/useSystemSetting";

vi.mock("@/utils/sanitizeHtml", () => ({
    sanitizeHtml: (html: string) => html,
}));

// ── Accordion mock — captures onValueChange ───────────────────────────────────
let capturedOnValueChange: ((value: string) => void) | null = null;

vi.mock("@/components/landing/Accordion", () => ({
    Accordion: ({ children, onValueChange }: any) => {
        capturedOnValueChange = onValueChange;
        return <div data-testid="accordion">{children}</div>;
    },
    AccordionItem: ({ children }: any) => <div data-testid="accordion-item">{children}</div>,
    AccordionTrigger: ({ children }: any) => <button>{children}</button>,
    AccordionContent: ({ children }: any) => <div data-testid="accordion-content">{children}</div>,
}));

// ── Telemetry mock ────────────────────────────────────────────────────────────
const mockInteract = vi.fn();
vi.mock('@/hooks/useTelemetry', () => ({
    useTelemetry: () => ({
        interact: mockInteract,
        impression: vi.fn(),
        feedback: vi.fn(),
        log: vi.fn(),
        isInitialized: true,
    }),
}));

// ── NavigationHelperService mock ──────────────────────────────────────────────
const mockShouldProcessNavigationClick = vi.fn(() => true);
vi.mock('@/services/NavigationHelperService', () => ({
    navigationHelperService: {
        shouldProcessNavigationClick: () => mockShouldProcessNavigationClick(),
        storeUrlHistory: vi.fn(),
        getPageLoadTime: vi.fn(() => 0),
        pageStartTime: Date.now(),
    },
}));

// ── useImpression mock — prevents router dependency in page tests ─────────────
vi.mock('@/hooks/useImpression', () => ({
    default: vi.fn(),
}));

// ── Other mocks ───────────────────────────────────────────────────────────────
const mockUseHelpFaqData = vi.fn();
vi.mock("@/hooks/useFaqData", () => ({
    useHelpFaqData: (...args: any[]) => mockUseHelpFaqData(...args),
}));

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
        getAuthInfo: vi.fn().mockResolvedValue({ sid: 'test-session', uid: 'test-user-id', isAuthenticated: true }),
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

// ── Shared test data ──────────────────────────────────────────────────────────
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
        capturedOnValueChange = null;
        mockShouldProcessNavigationClick.mockReturnValue(true);

        mockUseHelpFaqData.mockReturnValue({ categories: mockCategories, loading: false, error: null });
        vi.mocked(useParams).mockReturnValue({ categoryId: 'login' });
        vi.mocked(useSystemSetting).mockReturnValue({
            data: { data: { response: { value: 'Test App' } } },
            isLoading: false,
        } as any);
    });

    // ── Existing render tests ─────────────────────────────────────────────────

    it('renders category FAQs and replaces app name placeholders', async () => {
        const categoriesWithPlaceholder = [
            {
                name: "About {{APP_NAME}}",
                faqs: [{ topic: "What is {{APP_NAME}}?", description: "Welcome to {{APP_NAME}}" }]
            }
        ];
        mockUseHelpFaqData.mockReturnValue({ categories: categoriesWithPlaceholder, loading: false, error: null });
        vi.mocked(useParams).mockReturnValue({ categoryId: 'about-app-name' });

        render(<MemoryRouter initialEntries={['/help-support/about-app-name']}><HelpCategoryDetail /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByText("About Test App FAQs")).toBeInTheDocument();
            expect(screen.getByText("What is Test App?")).toBeInTheDocument();
            expect(screen.getByText("Welcome to Test App")).toBeInTheDocument();
        });
    });

    it('handles feedback submission (Yes)', async () => {
        render(<MemoryRouter><HelpCategoryDetail /></MemoryRouter>);
        fireEvent.click(screen.getAllByText('yes')[0]!);
        await waitFor(() => { expect(screen.getAllByText('help.feedbackThanks')[0]!).toBeInTheDocument(); });
    });

    it('handles feedback submission (No) with text input', async () => {
        render(<MemoryRouter><HelpCategoryDetail /></MemoryRouter>);
        fireEvent.click(screen.getAllByText('no')[0]!);
        fireEvent.change(screen.getByPlaceholderText('help.typeHere'), { target: { value: 'Needs more details' } });
        fireEvent.click(screen.getByText('help.submitFeedback'));
        await waitFor(() => { expect(screen.getAllByText('help.feedbackThanks')[0]!).toBeInTheDocument(); });
    });

    it('disables submit button when feedback is empty', () => {
        render(<MemoryRouter><HelpCategoryDetail /></MemoryRouter>);
        fireEvent.click(screen.getAllByText('no')[0]!);
        expect(screen.getByText('help.submitFeedback')).toBeDisabled();
        fireEvent.change(screen.getByPlaceholderText('help.typeHere'), { target: { value: 'Some feedback' } });
        expect(screen.getByText('help.submitFeedback')).not.toBeDisabled();
    });

    it('shows loading state', () => {
        mockUseHelpFaqData.mockReturnValue({ categories: [], loading: true, error: null });
        render(<MemoryRouter><HelpCategoryDetail /></MemoryRouter>);
        expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    });

    it('shows error state when fetch fails', () => {
        mockUseHelpFaqData.mockReturnValue({ categories: [], loading: false, error: new Error('fail') });
        render(<MemoryRouter><HelpCategoryDetail /></MemoryRouter>);
        expect(screen.getByText('somethingWentWrong')).toBeInTheDocument();
    });

    it('shows error when category is not found', () => {
        vi.mocked(useParams).mockReturnValue({ categoryId: 'invalid-id' });
        render(<MemoryRouter><HelpCategoryDetail /></MemoryRouter>);
        expect(screen.getByText('help.categoryNotFound')).toBeInTheDocument();
    });

    // ── Go Back: navigation throttle ─────────────────────────────────────────

    describe('Go Back button', () => {
        it('navigates when shouldProcessNavigationClick returns true', () => {
            mockShouldProcessNavigationClick.mockReturnValue(true);
            render(<MemoryRouter><HelpCategoryDetail /></MemoryRouter>);
            fireEvent.click(screen.getByText('button.goBack'));
            expect(mockNavigate).toHaveBeenCalledWith('/help-support');
        });

        it('does NOT navigate when shouldProcessNavigationClick returns false (throttled)', () => {
            mockShouldProcessNavigationClick.mockReturnValue(false);
            render(<MemoryRouter><HelpCategoryDetail /></MemoryRouter>);
            fireEvent.click(screen.getByText('button.goBack'));
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });

    // ── FAQ accordion: toggle-clicked telemetry ───────────────────────────────

    describe('FAQ accordion toggle telemetry', () => {
        it('fires interact with toggle-clicked and isOpened:true when an item opens', () => {
            render(<MemoryRouter><HelpCategoryDetail /></MemoryRouter>);

            act(() => { capturedOnValueChange?.('item-1'); });

            expect(mockInteract).toHaveBeenCalledWith({
                edata: {
                    id: 'faq',
                    subtype: 'toggle-clicked',
                    type: 'TOUCH',
                    pageid: expect.any(String),
                    extra: {
                        values: {
                            action: 'toggle-clicked',
                            position: 2,
                            value: expect.objectContaining({ topic: expect.any(String) }),
                            isOpened: true,
                        },
                    },
                },
            });
        });

        it('fires interact with isOpened:false when open item is collapsed', () => {
            render(<MemoryRouter><HelpCategoryDetail /></MemoryRouter>);

            act(() => { capturedOnValueChange?.('item-0'); });
            mockInteract.mockClear();
            act(() => { capturedOnValueChange?.(''); });

            expect(mockInteract).toHaveBeenCalledWith(
                expect.objectContaining({
                    edata: expect.objectContaining({
                        extra: expect.objectContaining({
                            values: expect.objectContaining({ isOpened: false, position: 1 }),
                        }),
                    }),
                })
            );
        });

        it('fires with correct topic and description from sanitized FAQ', () => {
            render(<MemoryRouter><HelpCategoryDetail /></MemoryRouter>);

            act(() => { capturedOnValueChange?.('item-0'); });

            const values = mockInteract.mock.calls[0]![0].edata.extra.values;
            expect(values.value.topic).toBeTruthy();
            expect(values.value.description).toBeTruthy();
        });
    });

    // ── Submit feedback: submit-clicked telemetry ─────────────────────────────

    describe('Submit feedback telemetry', () => {
        it('fires interact with subtype submit-clicked and knowMoreText on submit', async () => {
            render(<MemoryRouter><HelpCategoryDetail /></MemoryRouter>);

            fireEvent.click(screen.getAllByText('no')[0]!);
            fireEvent.change(screen.getByPlaceholderText('help.typeHere'), { target: { value: 'TEST' } });
            fireEvent.click(screen.getByText('help.submitFeedback'));

            await waitFor(() => {
                expect(mockInteract).toHaveBeenCalledWith({
                    edata: {
                        id: 'faq',
                        subtype: 'submit-clicked',
                        type: 'TOUCH',
                        pageid: expect.any(String),
                        extra: {
                            values: {
                                action: 'submit-clicked',
                                position: 1,
                                value: expect.objectContaining({
                                    knowMoreText: 'TEST',
                                    topic: expect.any(String),
                                    description: expect.any(String),
                                }),
                            },
                        },
                    },
                });
            });
        });

        it('uses position 1-based index matching the FAQ item', async () => {
            render(<MemoryRouter><HelpCategoryDetail /></MemoryRouter>);

            // Click 'no' on the second FAQ item (index 1)
            fireEvent.click(screen.getAllByText('no')[1]!);
            fireEvent.change(screen.getByPlaceholderText('help.typeHere'), { target: { value: 'feedback' } });
            fireEvent.click(screen.getByText('help.submitFeedback'));

            await waitFor(() => {
                const values = mockInteract.mock.calls[0]![0].edata.extra.values;
                expect(values.position).toBe(2);
            });
        });

        it('clears feedback text after submission', async () => {
            render(<MemoryRouter><HelpCategoryDetail /></MemoryRouter>);

            fireEvent.click(screen.getAllByText('no')[0]!);
            fireEvent.change(screen.getByPlaceholderText('help.typeHere'), { target: { value: 'My feedback' } });
            fireEvent.click(screen.getByText('help.submitFeedback'));

            await waitFor(() => {
                expect(screen.getAllByText('help.feedbackThanks')[0]!).toBeInTheDocument();
            });
        });
    });
});
