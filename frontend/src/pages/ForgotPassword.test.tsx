
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForgotPassword from '../pages/ForgotPassword';

// Mock AuthLayout
vi.mock('@/components/AuthLayout', () => ({
    AuthLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('ForgotPassword', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = () => {
        return render(
            <BrowserRouter>
                <ForgotPassword />
            </BrowserRouter>
        );
    };

    it('renders step 1 initially', () => {
        renderComponent();
        expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Enter Email ID \/ Mobile Number/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Enter name/i)).toBeInTheDocument();
    });

    it('validates step 1 inputs and proceeds to step 2', async () => {
        renderComponent();
        const identifierInput = screen.getByPlaceholderText(/Enter Email ID \/ Mobile Number/i);
        const nameInput = screen.getByPlaceholderText(/Enter name/i);
        const continueButton = screen.getByRole('button', { name: /Continue/i });

        // Initial state: button disabled
        expect(continueButton).toBeDisabled();

        // Invalid email
        await userEvent.type(identifierInput, 'invalid-email');
        expect(continueButton).toBeDisabled();

        // Valid email, empty name
        await userEvent.clear(identifierInput);
        await userEvent.type(identifierInput, 'test@example.com');
        expect(continueButton).toBeDisabled();

        // Valid inputs
        await userEvent.type(nameInput, 'John Doe');
        expect(continueButton).toBeEnabled();

        // Proceed to Step 2
        fireEvent.click(continueButton);
        expect(screen.getByText('Where would you like to receive the OTP?')).toBeInTheDocument();
    });

    it('selects OTP source in step 2 and proceeds to step 3', async () => {
        renderComponent();

        // Fast-forward to Step 2
        await userEvent.type(screen.getByPlaceholderText(/Enter Email ID \/ Mobile Number/i), 'test@example.com');
        await userEvent.type(screen.getByPlaceholderText(/Enter name/i), 'John Doe');
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

        const getOtpButton = screen.getByRole('button', { name: /Get OTP/i });
        expect(getOtpButton).toBeDisabled();

        const radio = screen.getByRole('radio');
        fireEvent.click(radio);

        expect(radio).toBeChecked();
        expect(getOtpButton).toBeEnabled();

        // Proceed to Step 3
        fireEvent.click(getOtpButton);
        expect(screen.getByText('Enter the code')).toBeInTheDocument();
    });

    it('enters OTP in step 3 and proceeds to step 4', async () => {
        renderComponent();

        // Fast-forward to Step 3
        await userEvent.type(screen.getByPlaceholderText(/Enter Email ID \/ Mobile Number/i), 'test@example.com');
        await userEvent.type(screen.getByPlaceholderText(/Enter name/i), 'John Doe');
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
        fireEvent.click(screen.getByRole('radio'));
        fireEvent.click(screen.getByRole('button', { name: /Get OTP/i }));

        const confirmButton = screen.getByRole('button', { name: /Confirm and Proceed/i });
        expect(confirmButton).toBeDisabled();

        // Enter OTP logic
        for (let i = 0; i < 6; i++) {
            // We know ids are otp-0 to otp-5 from component code
            const input = document.getElementById(`otp-${i}`) as HTMLInputElement;
            expect(input).toBeInTheDocument();
            await userEvent.type(input, String(i + 1));
        }

        expect(confirmButton).toBeEnabled();

        fireEvent.click(confirmButton);
        expect(screen.getByText('Create New Password')).toBeInTheDocument();
    });

    it('validates password in step 4 and completes the flow', async () => {
        renderComponent();

        // Fast-forward to Step 4
        await userEvent.type(screen.getByPlaceholderText(/Enter Email ID \/ Mobile Number/i), 'test@example.com');
        await userEvent.type(screen.getByPlaceholderText(/Enter name/i), 'John Doe');
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
        fireEvent.click(screen.getByRole('radio'));
        fireEvent.click(screen.getByRole('button', { name: /Get OTP/i }));

        for (let i = 0; i < 6; i++) {
            const input = document.getElementById(`otp-${i}`) as HTMLInputElement;
            expect(input).toBeInTheDocument();
            await userEvent.type(input, String(i + 1));
        }

        fireEvent.click(screen.getByRole('button', { name: /Confirm and Proceed/i }));

        // Step 4
        const newPassInput = screen.getByPlaceholderText(/^Enter New Password$/i);
        const confirmPassInput = screen.getByPlaceholderText(/^Confirm New Password$/i);
        const resetButton = screen.getByRole('button', { name: /Reset Password/i });

        expect(resetButton).toBeDisabled();

        // Weak password
        await userEvent.type(newPassInput, 'weak');
        expect(resetButton).toBeDisabled();
        expect(screen.getByText(/Password must be 8\+ chars/i)).toBeVisible();

        // Valid password but not matching
        await userEvent.clear(newPassInput);
        await userEvent.type(newPassInput, 'Strong@123');
        await userEvent.type(confirmPassInput, 'Mismatch@123');
        expect(resetButton).toBeDisabled();
        // Assuming invisible check works or we just check content existence
        expect(screen.getByText(/Passwords do not match/i)).toBeVisible();

        // Matching valid password
        await userEvent.clear(confirmPassInput);
        await userEvent.type(confirmPassInput, 'Strong@123');
        expect(resetButton).toBeEnabled();

        fireEvent.click(resetButton);
        expect(screen.getByText('Congratulations!')).toBeInTheDocument();
    });

    it('redirects to login in step 5', async () => {
        // We need to mock window.location.href
        const originalLocation = window.location;
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { href: '' },
        });

        renderComponent();
        // Fast-forward to Step 5
        await userEvent.type(screen.getByPlaceholderText(/Enter Email ID \/ Mobile Number/i), 'test@example.com');
        await userEvent.type(screen.getByPlaceholderText(/Enter name/i), 'John Doe');
        fireEvent.click(screen.getByRole('button', { name: /Continue/i }));
        fireEvent.click(screen.getByRole('radio'));
        fireEvent.click(screen.getByRole('button', { name: /Get OTP/i }));

        for (let i = 0; i < 6; i++) {
            const input = document.getElementById(`otp-${i}`) as HTMLInputElement;
            expect(input).toBeInTheDocument();
            await userEvent.type(input, String(i + 1));
        }

        fireEvent.click(screen.getByRole('button', { name: /Confirm and Proceed/i }));
        await userEvent.type(screen.getByPlaceholderText(/^Enter New Password$/i), 'Strong@123');
        await userEvent.type(screen.getByPlaceholderText(/^Confirm New Password$/i), 'Strong@123');
        fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));

        // Step 5
        const proceedButton = screen.getByRole('button', { name: /Proceed to Login/i });
        fireEvent.click(proceedButton);
        expect(window.location.href).toBe('/home');

        // Restore location
        Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    });
});
