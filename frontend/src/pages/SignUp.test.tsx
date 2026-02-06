import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SignUp from './SignUp';
import { BrowserRouter } from 'react-router-dom';

// Mock hooks
const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock("@/hooks/useToast", () => ({
    useToast: () => ({ toast: mockToast })
}));

// We can use the actual SignUpStep components as they are exported from SignUpSteps.tsx
// But it's easier to mock them to control the flow in the Page test
vi.mock('@/components/SignUpSteps', () => ({
    SignUpStep1: ({ handleContinue, setEmailOrMobile, setPassword, setConfirmPassword, setIsTermsAccepted }: any) => (
        <div>
            <button data-testid="continue-btn" onClick={handleContinue}>Continue</button>
            <input data-testid="email-input" onChange={(e) => setEmailOrMobile(e.target.value)} />
            <input data-testid="pass-input" onChange={(e) => setPassword(e.target.value)} />
            <input data-testid="conf-input" onChange={(e) => setConfirmPassword(e.target.value)} />
            <input type="checkbox" data-testid="terms-check" onChange={(e) => setIsTermsAccepted(e.target.checked)} />
        </div>
    ),
    SignUpStep2: ({ handleVerifyOtp, setOtp }: any) => (
        <div>
            <button data-testid="verify-btn" onClick={handleVerifyOtp}>Verify</button>
            <button data-testid="fill-otp-btn" onClick={() => setOtp(['1', '2', '3', '4', '5', '6'])}>Fill OTP</button>
        </div>
    )
}));

describe('SignUp Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Step 1 initially', () => {
        render(
            <BrowserRouter>
                <SignUp />
            </BrowserRouter>
        );
        expect(screen.getByTestId('continue-btn')).toBeInTheDocument();
    });

    it('shows error if identifier is invalid', () => {
        render(
            <BrowserRouter>
                <SignUp />
            </BrowserRouter>
        );
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'invalid' } });
        fireEvent.click(screen.getByTestId('continue-btn'));
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Invalid Email or Mobile' }));
    });

    it('shows error if password is weak', () => {
        render(
            <BrowserRouter>
                <SignUp />
            </BrowserRouter>
        );
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('pass-input'), { target: { value: 'weak' } });
        fireEvent.click(screen.getByTestId('continue-btn'));
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Weak Password' }));
    });

    it('shows error if passwords mismatch', () => {
        render(
            <BrowserRouter>
                <SignUp />
            </BrowserRouter>
        );
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('pass-input'), { target: { value: 'Pass123!' } });
        fireEvent.change(screen.getByTestId('conf-input'), { target: { value: 'Different!' } });
        fireEvent.click(screen.getByTestId('continue-btn'));
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Passwords Mismatch' }));
    });

    it('shows error if terms not accepted', () => {
        render(
            <BrowserRouter>
                <SignUp />
            </BrowserRouter>
        );
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('pass-input'), { target: { value: 'Pass123!' } });
        fireEvent.change(screen.getByTestId('conf-input'), { target: { value: 'Pass123!' } });
        // terms-check is false by default
        fireEvent.click(screen.getByTestId('continue-btn'));
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Terms Not Accepted' }));
    });

    it('transitions to Step 2 when validation passes', () => {
        render(
            <BrowserRouter>
                <SignUp />
            </BrowserRouter>
        );
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('pass-input'), { target: { value: 'Pass123!' } });
        fireEvent.change(screen.getByTestId('conf-input'), { target: { value: 'Pass123!' } });
        fireEvent.click(screen.getByTestId('terms-check'));

        fireEvent.click(screen.getByTestId('continue-btn'));
        expect(screen.getByTestId('verify-btn')).toBeInTheDocument();
    });

    it('handles OTP verification and navigation', async () => {
        vi.useFakeTimers();
        render(
            <BrowserRouter>
                <SignUp />
            </BrowserRouter>
        );

        // Transition to step 2
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('pass-input'), { target: { value: 'Pass123!' } });
        fireEvent.change(screen.getByTestId('conf-input'), { target: { value: 'Pass123!' } });
        fireEvent.click(screen.getByTestId('terms-check'));
        fireEvent.click(screen.getByTestId('continue-btn'));

        // Verify Step 2
        fireEvent.click(screen.getByTestId('fill-otp-btn'));
        fireEvent.click(screen.getByTestId('verify-btn'));

        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Account Created' }));

        vi.advanceTimersByTime(1000);
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
        vi.useRealTimers();
    });
});
