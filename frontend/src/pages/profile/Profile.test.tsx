import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Profile from './Profile';

vi.mock('@/components/profile/ProfileCard', () => ({ default: () => <div data-testid="profile-card" /> }));
vi.mock('@/components/profile/PersonalInformation', () => ({ default: () => <div data-testid="personal-info" /> }));
vi.mock('@/components/profile/ProfileStatsCards', () => ({ default: () => <div data-testid="stats-cards" /> }));
vi.mock('@/components/profile/ProfileLearningList', () => ({ default: () => <div data-testid="learning-list" /> }));
vi.mock('@/components/common/PageLoader', () => ({ default: () => <div>Loading...</div> }));

vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'profilePage.loading': 'Loading...',
                'profilePage.errorLoading': 'Error loading profile...',
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

const mockUserData = {
    id: '75a0d064-b41a-4ff8-ac22-38611acbddfe',
    identifier: '75a0d064-b41a-4ff8-ac22-38611acbddfe',
    firstName: 'Chetann',
    lastName: 'Test0r8',
    email: 'user@yopmail.com',
    maskedEmail: 'us****************@yopmail.com',
    phone: '1234567890',
    maskedPhone: null,
    userName: 'user_1770717393784@yopmail.com',
    dob: '2001-12-31',
    channel: 'sunbird',
    rootOrgId: '0144880972895272960',
    status: 0,
    isDeleted: false,
    profileUserTypes: [{ type: 'student' }],
    profileLocation: [
        { id: '692b97c7-c166-4f31-92e1-b4c1d25dea50', type: 'district' },
        { id: '7758262b-884a-447e-90ae-23a0153de1bf', type: 'state' },
    ],
    organisations: [],
    roles: [],
};

const mockUseUserRead = vi.fn();
vi.mock('@/hooks/useUserRead', () => ({
    useUserRead: (options?: any) => mockUseUserRead(options),
}));

describe('Profile Page', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        mockUseUserRead.mockReturnValue({
            data: { data: { response: mockUserData } },
            isLoading: false,
            isError: false,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const renderProfile = () =>
        render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={['/profile']}>
                    <Profile />
                </MemoryRouter>
            </QueryClientProvider>
        );

    it('renders all profile sections', () => {
        renderProfile();

        expect(screen.getByTestId('profile-card')).toBeInTheDocument();
        expect(screen.getByTestId('personal-info')).toBeInTheDocument();
        expect(screen.getByTestId('stats-cards')).toBeInTheDocument();
        expect(screen.getByTestId('learning-list')).toBeInTheDocument();
    });

    it('calls useUserRead with refetchOnMount: always to always get fresh user data', () => {
        renderProfile();
        expect(mockUseUserRead).toHaveBeenCalledWith({ refetchOnMount: 'always' });
    });

    it('shows loading when isLoading is true (line 21 true branch)', () => {
        mockUseUserRead.mockReturnValue({ data: undefined, isLoading: true, isError: false });
        renderProfile();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByTestId('profile-card')).not.toBeInTheDocument();
    });

    it('shows error when isError is true (line 23 true branch)', () => {
        mockUseUserRead.mockReturnValue({ data: undefined, isLoading: false, isError: true });
        renderProfile();
        expect(screen.getByText('Loading...')).toBeInTheDocument(); // PageLoader mock
        expect(screen.queryByTestId('profile-card')).not.toBeInTheDocument();
    });

    it('shows error when userData is null (line 23 !userData branch)', () => {
        mockUseUserRead.mockReturnValue({ data: null, isLoading: false, isError: false });
        renderProfile();
        expect(screen.queryByTestId('profile-card')).not.toBeInTheDocument();
    });
});