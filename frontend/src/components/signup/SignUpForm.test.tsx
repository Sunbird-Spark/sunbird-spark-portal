import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SignUpForm } from './SignUpForm';

vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({
        t: (key: string) => {
            const map: Record<string, string> = {
                'signUp.welcomeTitle': 'Welcome',
                'signUp.welcomeSubtitle': 'Create your account',
                'signUp.firstName': 'First Name',
                'signUp.emailOrMobile': 'Email or Mobile',
                'signUp.password': 'Password',
                'signUp.confirmPassword': 'Confirm Password',
                'signUp.showPassword': 'Show password',
                'signUp.hidePassword': 'Hide password',
                'signUp.showConfirmPassword': 'Show confirm password',
                'signUp.hideConfirmPassword': 'Hide confirm password',
                'continue': 'Continue',
                'signUp.creatingAccount': 'Creating Account...',
                'signUp.alreadyHaveAccount': 'Already have an account?',
                'login': 'Login',
            };
            return map[key] ?? key;
        },
    }),
}));

vi.mock('@/utils/forgotPasswordUtils', () => ({
    isMobileApp: vi.fn(() => false),
    getSafeRedirectUrl: vi.fn(() => '/portal/login?prompt=none'),
}));

vi.mock('@/components/common/Input', () => ({
    Input: (props: any) => <input {...props} />,
}));

vi.mock('../../pages/forgotPassword/ForgotPasswordComponents', () => ({
    Header: ({ title, subtitle }: any) => (
        <div>
            <span data-testid="header-title">{title}</span>
            <span data-testid="header-subtitle">{subtitle}</span>
        </div>
    ),
    InputLabel: ({ children }: any) => <label>{children}</label>,
    PrimaryButton: ({ children, onClick, disabled }: any) => (
        <button onClick={onClick} disabled={disabled}>{children}</button>
    ),
}));

describe('SignUpForm', () => {
    const defaultProps = {
        firstName: '',
        setFirstName: vi.fn(),
        emailOrMobile: '',
        setEmailOrMobile: vi.fn(),
        password: '',
        setPassword: vi.fn(),
        confirmPassword: '',
        setConfirmPassword: vi.fn(),
        showPassword: false,
        setShowPassword: vi.fn(),
        showConfirmPassword: false,
        setShowConfirmPassword: vi.fn(),
        handleContinue: vi.fn(),
        isStep1Valid: true,
        isLoading: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the form with all inputs', () => {
        render(<SignUpForm {...defaultProps} />);
        expect(screen.getByTestId('header-title')).toHaveTextContent('Welcome');
    });

    it('calls setShowPassword when password toggle is clicked (line 97)', () => {
        render(<SignUpForm {...defaultProps} showPassword={false} />);

        const toggleBtn = screen.getByLabelText('Show password');
        fireEvent.click(toggleBtn);

        expect(defaultProps.setShowPassword).toHaveBeenCalledWith(expect.any(Function));
    });

    it('shows FiEyeOff icon when showPassword is true (line 100)', () => {
        render(<SignUpForm {...defaultProps} showPassword={true} />);

        const toggleBtn = screen.getByLabelText('Hide password');
        expect(toggleBtn).toBeInTheDocument();
    });

    it('calls setShowConfirmPassword when confirm password toggle is clicked (line 128)', () => {
        render(<SignUpForm {...defaultProps} showConfirmPassword={false} />);

        const toggleBtn = screen.getByLabelText('Show confirm password');
        fireEvent.click(toggleBtn);

        expect(defaultProps.setShowConfirmPassword).toHaveBeenCalledWith(expect.any(Function));
    });

    it('shows FiEyeOff icon when showConfirmPassword is true (line 128)', () => {
        render(<SignUpForm {...defaultProps} showConfirmPassword={true} />);

        const toggleBtn = screen.getByLabelText('Hide confirm password');
        expect(toggleBtn).toBeInTheDocument();
    });

    it('calls handleContinue when Continue button is clicked', () => {
        render(<SignUpForm {...defaultProps} />);
        fireEvent.click(screen.getByText('Continue'));
        expect(defaultProps.handleContinue).toHaveBeenCalled();
    });

    it('shows creating account text when isLoading is true', () => {
        render(<SignUpForm {...defaultProps} isLoading={true} />);
        expect(screen.getByText('Creating Account...')).toBeInTheDocument();
    });
});
