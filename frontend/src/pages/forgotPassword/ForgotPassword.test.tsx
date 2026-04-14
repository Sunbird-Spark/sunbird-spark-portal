import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ForgotPassword from './ForgotPassword';

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useLocation: vi.fn(() => ({ pathname: '/' })),
    };
});
import React from 'react';
import { useSystemSetting } from '@/hooks/useSystemSetting';

// Mock AuthLayout (correct path matches the component import)
vi.mock('@/components/auth/AuthLayout', () => ({
    AuthLayout: ({ children }: any) => <div data-testid="auth-layout">{children}</div>
}));

// Mock hooks
vi.mock('@/hooks/useUser', () => ({
    useLearnerFuzzySearch: vi.fn(() => ({ mutateAsync: vi.fn() })),
    useResetPassword: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

vi.mock('@/hooks/useOtp', () => ({
    useGenerateOtp: vi.fn(() => ({ mutateAsync: vi.fn() })),
    useVerifyOtp: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

vi.mock('@/hooks/useSystemSetting', () => ({
    useSystemSetting: vi.fn(() => ({ data: undefined, isLoading: false })),
}));

// Mock child components
vi.mock('./IdentifyUser', () => ({
    IdentifyUser: ({ onSuccess }: any) => (
        <button data-testid="identify-btn" onClick={() => onSuccess([{ id: 'u1', type: 'phone', value: '123' }])}>
            Identify
        </button>
    )
}));

vi.mock('./SelectOTPDelivery', () => ({
    SelectOTPDelivery: ({ onSuccess }: any) => (
        <button data-testid="delivery-btn" onClick={() => onSuccess({ id: 'u1', type: 'phone', value: '123' })}>
            Delivery
        </button>
    )
}));

vi.mock('./VerifyOTP', () => ({
    VerifyOTP: () => <div data-testid="verify-otp-comp">Verify OTP</div>
}));

// Mock i18n module — vi.hoisted ensures the variable is available when vi.mock is hoisted
const { mockChangeLanguage } = vi.hoisted(() => ({
    mockChangeLanguage: vi.fn(() => Promise.resolve()),
}));
vi.mock('@/configs/i18n', () => ({
    default: { changeLanguage: mockChangeLanguage },
}));

// Mock forgotPasswordUtils
vi.mock('@/utils/forgotPasswordUtils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/utils/forgotPasswordUtils')>();
    return {
        ...actual,
        isMobileApp: vi.fn(() => false),
        persistMobileContext: vi.fn(),
    };
});

// Mock TelemetryTracker
vi.mock('@/components/telemetry/TelemetryTracker', () => ({
    TelemetryTracker: () => null,
}));

// Mock useImpression
vi.mock('@/hooks/useImpression', () => ({
    default: vi.fn(),
}));

// Mock useTelemetry
vi.mock('@/hooks/useTelemetry', () => ({
    useTelemetry: () => ({ log: vi.fn() }),
}));

describe('ForgotPassword', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('renders IdentifyUser on step 1', () => {
        render(<ForgotPassword />);

        expect(screen.getByTestId('auth-layout')).toBeInTheDocument();
        expect(screen.getByTestId('identify-btn')).toBeInTheDocument();
        expect(screen.queryByTestId('delivery-btn')).not.toBeInTheDocument();
        expect(screen.queryByTestId('verify-otp-comp')).not.toBeInTheDocument();
    });

    it('transitions to step 2 after IdentifyUser succeeds', async () => {
        render(<ForgotPassword />);

        fireEvent.click(screen.getByTestId('identify-btn'));

        await waitFor(() => {
            expect(screen.getByTestId('delivery-btn')).toBeInTheDocument();
        });

        expect(screen.queryByTestId('identify-btn')).not.toBeInTheDocument();
        expect(screen.queryByTestId('verify-otp-comp')).not.toBeInTheDocument();
    });

    it('transitions to step 3 after OTP delivery is selected', async () => {
        render(<ForgotPassword />);

        fireEvent.click(screen.getByTestId('identify-btn'));
        await waitFor(() => expect(screen.getByTestId('delivery-btn')).toBeInTheDocument());

        fireEvent.click(screen.getByTestId('delivery-btn'));
        await waitFor(() => {
            expect(screen.getByTestId('verify-otp-comp')).toBeInTheDocument();
        });

        expect(screen.queryByTestId('identify-btn')).not.toBeInTheDocument();
        expect(screen.queryByTestId('delivery-btn')).not.toBeInTheDocument();
    });

    it('renders without error when captcha site key is unavailable', () => {
        render(<ForgotPassword />);

        expect(screen.getByTestId('identify-btn')).toBeInTheDocument();
    });

    it('renders without error when captcha site key is available', () => {
        vi.mocked(useSystemSetting).mockReturnValue({
            data: { data: { response: { value: 'test-site-key' } } },
            isLoading: false,
        } as any);

        render(<ForgotPassword />);

        expect(screen.getByTestId('identify-btn')).toBeInTheDocument();
    });

    describe('language param handling', () => {
        const originalLocation = window.location;

        beforeEach(() => {
            Object.defineProperty(window, 'location', {
                value: { ...originalLocation, search: '' },
                writable: true,
            });
        });

        afterEach(() => {
            Object.defineProperty(window, 'location', {
                value: originalLocation,
                writable: true,
            });
        });

        it('persists supported lang param to localStorage and changes language', () => {
            window.location.search = '?lang=fr';
            render(<ForgotPassword />);

            expect(localStorage.getItem('app-language')).toBe('fr');
            expect(mockChangeLanguage).toHaveBeenCalledWith('fr');
        });

        it('ignores unsupported lang param', () => {
            window.location.search = '?lang=xx';
            render(<ForgotPassword />);

            expect(localStorage.getItem('app-language')).toBeNull();
            expect(mockChangeLanguage).not.toHaveBeenCalled();
        });

        it('does nothing when no lang param is present', () => {
            window.location.search = '';
            render(<ForgotPassword />);

            expect(localStorage.getItem('app-language')).toBeNull();
            expect(mockChangeLanguage).not.toHaveBeenCalled();
        });
    });
});
