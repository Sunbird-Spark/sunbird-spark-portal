import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ForgotPassword from './ForgotPassword';
import React from 'react';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn()
}));

// Mock AuthLayout
vi.mock('@/components/AuthLayout', () => ({
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
    useResetPassword: vi.fn(() => ({ mutateAsync: vi.fn() }))
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

describe('ForgotPassword', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('transitions through steps', async () => {
        render(<ForgotPassword />);

        // Step 1
        fireEvent.click(screen.getByTestId('identify-btn'));

        // Step 2
        await waitFor(() => {
            expect(screen.getByTestId('delivery-btn')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('delivery-btn'));

        // Step 3
        await waitFor(() => {
            expect(screen.getByTestId('verify-otp-comp')).toBeInTheDocument();
        });
    });
});
