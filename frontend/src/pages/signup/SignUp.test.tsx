import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

// Mock user hooks
vi.mock('@/hooks/useUser', () => ({
    useSignup: () => ({
        mutate: vi.fn((variables, options) => {
            options?.onSuccess?.({ status: 200 });
        }),
        isPending: false
    })
}));

// Mock OTP hooks
vi.mock('@/hooks/useOtp', () => ({
    useGenerateOtp: () => ({
        mutate: vi.fn((variables, options) => {
            options?.onSuccess?.({ status: 200 });
        }),
        isPending: false
    }),
    useVerifyOtp: () => ({
        mutate: vi.fn((variables, options) => {
            options?.onSuccess?.({ status: 200 });
        }),
        isPending: false
    })
}));

// Mock ReCAPTCHA
vi.mock('react-google-recaptcha', async () => {
    const React = await import('react');
    return {
        default: React.forwardRef((props: any, ref: any) => {
            React.useImperativeHandle(ref, () => ({
                execute: vi.fn(),
                reset: vi.fn(),
            }));
            return null;
        })
    };
});

// Mock SystemSettingService
vi.mock('@/services/SystemSettingService', () => ({
    SystemSettingService: class {
        read = vi.fn().mockResolvedValue({ data: { result: { value: '' } } });
    }
}));

// Mock individual step components to control the flow in the Page test
vi.mock('@/components/signup/SignUpForm', () => ({
    SignUpForm: ({ handleContinue, setFirstName, setEmailOrMobile, setPassword, setConfirmPassword, setIsTermsAccepted }: any) => (
        <div>
            <button data-testid="continue-btn" onClick={handleContinue}>Continue</button>
            <input data-testid="firstname-input" onChange={(e) => setFirstName(e.target.value)} />
            <input data-testid="email-input" onChange={(e) => setEmailOrMobile(e.target.value)} />
            <input data-testid="pass-input" onChange={(e) => setPassword(e.target.value)} />
            <input data-testid="conf-input" onChange={(e) => setConfirmPassword(e.target.value)} />
            <input type="checkbox" data-testid="terms-check" onChange={(e) => setIsTermsAccepted(e.target.checked)} />
        </div>
    )
}));

vi.mock('@/components/signup/SignUpOtpVerification', () => ({
    SignUpOtpVerification: ({ handleVerifyOtp, setOtp }: any) => (
        <div>
            <button data-testid="verify-btn" onClick={handleVerifyOtp}>Verify</button>
            <button data-testid="fill-otp-btn" onClick={() => setOtp(['1', '2', '3', '4', '5', '6'])}>Fill OTP</button>
        </div>
    )
}));

vi.mock('@/components/signup/SignUpSuccess', () => ({
    SignUpSuccess: ({ handleProceed }: any) => (
        <div>
            <div data-testid="success-message">Congratulations!</div>
            <button data-testid="proceed-btn" onClick={handleProceed}>Proceed to Login</button>
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
        fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
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
        fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
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
        fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
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
        fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('pass-input'), { target: { value: 'Pass123!' } });
        fireEvent.change(screen.getByTestId('conf-input'), { target: { value: 'Pass123!' } });
        // terms-check is false by default
        fireEvent.click(screen.getByTestId('continue-btn'));
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Terms Not Accepted' }));
    });

    it('transitions to Step 2 when validation passes', async () => {
        render(
            <BrowserRouter>
                <SignUp />
            </BrowserRouter>
        );
        fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('pass-input'), { target: { value: 'Pass123!' } });
        fireEvent.change(screen.getByTestId('conf-input'), { target: { value: 'Pass123!' } });
        fireEvent.click(screen.getByTestId('terms-check'));

        fireEvent.click(screen.getByTestId('continue-btn'));
        
        // Wait for async state update
        await screen.findByTestId('verify-btn');
        expect(screen.getByTestId('verify-btn')).toBeInTheDocument();
    });

    it('handles OTP verification and navigation', async () => {
        delete (window as any).location;
        window.location = { href: '' } as any;

        render(
            <BrowserRouter>
                <SignUp />
            </BrowserRouter>
        );

        // Transition to step 2
        fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
        fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByTestId('pass-input'), { target: { value: 'Pass123!' } });
        fireEvent.change(screen.getByTestId('conf-input'), { target: { value: 'Pass123!' } });
        fireEvent.click(screen.getByTestId('terms-check'));
        fireEvent.click(screen.getByTestId('continue-btn'));

        // Wait for step 2
        const verifyBtn = await screen.findByTestId('verify-btn');
        expect(verifyBtn).toBeInTheDocument();

        // Verify Step 2
        fireEvent.click(screen.getByTestId('fill-otp-btn'));
        fireEvent.click(verifyBtn);

        // Wait for step 3 (success screen)
        await waitFor(() => {
            expect(screen.getByTestId('success-message')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByTestId('proceed-btn'));
        expect(window.location.href).toBe('/profile');
    });
});
