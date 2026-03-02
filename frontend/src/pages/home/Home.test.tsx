import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

vi.mock('@/components/home/HomeDashboardContent', () => ({
    default: ({ loading, error, enrolledCount }: { loading: boolean; error?: string; enrolledCount: number; onRetry: () => void }) => (
        <div data-testid="dashboard-content"
            data-loading={String(loading)}
            data-error={error ?? ''}
            data-enrolled={enrolledCount}
        />
    ),
}));

vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({
        t: (key: string, options?: any) => {
            const translations: Record<string, string> = {
                'homePage.hiUser': `Hi ${options?.name}`,
                'homePage.hiGuest': 'Hi there',
                'homePage.journeyStart': 'Your exciting learning journey starts here. Dive in!',
                'homePage.welcomeMessage': 'Welcome to a learning experience made just for you.',
            };
            return translations[key] || key;
        },
    }),
}));

vi.mock('@/hooks/usePermission', () => ({
    usePermissions: vi.fn(() => ({
        isAuthenticated: true,
        isLoading: false,
        roles: ['CONTENT_CREATOR'],
        error: null,
        hasAnyRole: vi.fn(() => true),
        canAccessFeature: vi.fn(),
        refetch: vi.fn(),
    })),
}));

vi.mock('@/hooks/useSystemSetting', () => ({
    useSystemSetting: () => ({ data: {}, isSuccess: false }),
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

const mockUseUserRead = vi.fn();
vi.mock('@/hooks/useUserRead', () => ({
    useUserRead: () => mockUseUserRead(),
}));

const mockUseUserEnrolledCollections = vi.fn();
vi.mock('@/hooks/useUserEnrolledCollections', () => ({
    useUserEnrolledCollections: () => mockUseUserEnrolledCollections(),
}));

describe('Home Page', () => {
    beforeEach(() => {
        mockUseUserRead.mockReturnValue({
            data: {
                data: {
                    response: {
                        firstName: 'John',
                        lastName: 'Doe',
                    },
                },
            },
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        });
        mockUseUserEnrolledCollections.mockReturnValue({
            data: {
                data: {
                    courses: [{ courseId: 'c1' }, { courseId: 'c2' }],
                },
            },
            isLoading: false,
            error: null,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const createTestQueryClient = () => new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    const renderHome = () => {
        const queryClient = createTestQueryClient();
        return render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={['/home']}>
                    <Home />
                </MemoryRouter>
            </QueryClientProvider>
        );
    };

    it('renders the welcome message with user name', async () => {
        renderHome();

        await waitFor(() => {
            expect(screen.getByText('Hi John Doe')).toBeInTheDocument();
        });
        expect(screen.getByText('Welcome to a learning experience made just for you.')).toBeInTheDocument();
    });

    it('shows the onboarding subtitle when user has no enrollments', () => {
        mockUseUserEnrolledCollections.mockReturnValue({
            data: { data: { courses: [] } },
            isLoading: false,
            error: null,
        });

        renderHome();

        expect(screen.getByText('Your exciting learning journey starts here. Dive in!')).toBeInTheDocument();
        expect(screen.queryByText('Welcome to a learning experience made just for you.')).not.toBeInTheDocument();
    });

    it('shows the returning-user subtitle when user has enrollments', () => {
        renderHome();

        expect(screen.getByText('Welcome to a learning experience made just for you.')).toBeInTheDocument();
        expect(screen.queryByText('Your exciting learning journey starts here. Dive in!')).not.toBeInTheDocument();
    });

    it('renders "Hi there" when user profile is not available', () => {
        mockUseUserRead.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: null,
            refetch: vi.fn(),
        });
        mockUseUserEnrolledCollections.mockReturnValue({
            data: { data: { courses: [] } },
            isLoading: false,
            error: null,
        });

        renderHome();

        expect(screen.getByText('Hi there')).toBeInTheDocument();
    });

    it('passes loading=true to HomeDashboardContent when user data is loading', () => {
        mockUseUserRead.mockReturnValue({
            data: undefined,
            isLoading: true,
            error: null,
            refetch: vi.fn(),
        });

        renderHome();

        expect(screen.getByTestId('dashboard-content')).toHaveAttribute('data-loading', 'true');
    });

    it('passes loading=true to HomeDashboardContent when enrollments are loading', () => {
        mockUseUserEnrolledCollections.mockReturnValue({
            data: undefined,
            isLoading: true,
            error: null,
        });

        renderHome();

        expect(screen.getByTestId('dashboard-content')).toHaveAttribute('data-loading', 'true');
    });

    it('passes error message to HomeDashboardContent when user data fails', () => {
        mockUseUserRead.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Network error'),
            refetch: vi.fn(),
        });

        renderHome();

        expect(screen.getByTestId('dashboard-content')).toHaveAttribute('data-error', 'Network error');
    });

    it('passes enrolledCount to HomeDashboardContent', () => {
        renderHome();

        expect(screen.getByTestId('dashboard-content')).toHaveAttribute('data-enrolled', '2');
    });
});
