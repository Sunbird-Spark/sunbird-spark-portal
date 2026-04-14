import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IdentifyUser } from './IdentifyUser';

vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'forgotPassword': 'Forgot Password?',
                'forgotPasswordPage.subtitle': 'Enter your registered Email ID or Mobile number and name to reset your password',
                'forgotPasswordPage.emailOrMobile': 'Email ID / Mobile Number',
                'forgotPasswordPage.enterEmailOrMobile': 'Enter Email ID / Mobile Number',
                'forgotPasswordPage.emailOrMobileInstruction': 'Select the identifier to receive the OTP',
                'forgotPasswordPage.nameRegistered': 'Name registered in the portal',
                'forgotPasswordPage.enterName': 'Enter name',
                'continue': 'continue',
                'forgotPasswordPage.errorNotMatched': 'Email / mobile number or name does not match',
                'forgotPasswordPage.errorCaptcha': 'Captcha validation failed',
            };
            return translations[key] || key;
        },
    }),
}));

// Mock Recaptcha
vi.mock('react-google-recaptcha', () => {
    return {
        default: React.forwardRef((props: any, ref: any) => {
            React.useImperativeHandle(ref, () => ({
                execute: () => {
                    if (props.onChange) props.onChange('mock-token');
                },
                reset: () => { }
            }));
            return <div data-testid="mock-recaptcha" />;
        })
    };
});

describe('IdentifyUser', () => {
    const mockSearchUser = vi.fn();
    const mockOnSuccess = vi.fn();
    const googleCaptchaSiteKey = 'test-site-key';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <IdentifyUser
                googleCaptchaSiteKey={googleCaptchaSiteKey}
                searchUser={mockSearchUser}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.getByText('Forgot Password?')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Email ID / Mobile Number')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
    });

    it('disables continue button initially', () => {
        render(
            <IdentifyUser
                googleCaptchaSiteKey={googleCaptchaSiteKey}
                searchUser={mockSearchUser}
                onSuccess={mockOnSuccess}
            />
        );

        const continueBtn = screen.getByRole('button', { name: /continue/i });
        expect(continueBtn).toBeDisabled();
    });

    it('enables continue button when valid input is provided', () => {
        render(
            <IdentifyUser
                googleCaptchaSiteKey={googleCaptchaSiteKey}
                searchUser={mockSearchUser}
                onSuccess={mockOnSuccess}
            />
        );

        const identifierInput = screen.getByPlaceholderText('Enter Email ID / Mobile Number');
        const nameInput = screen.getByPlaceholderText('Enter name');
        const continueBtn = screen.getByRole('button', { name: /continue/i });

        fireEvent.change(identifierInput, { target: { value: '9876543210' } });
        fireEvent.change(nameInput, { target: { value: 'Test User' } });

        expect(continueBtn).not.toBeDisabled();
    });

    it('handles successful search with phone number', async () => {
        const mockResponse = {
            data: {
                response: {
                    content: [{ id: 'user-123', phone: '9876543210' }]
                }
            }
        };
        mockSearchUser.mockResolvedValue(mockResponse);

        render(
            <IdentifyUser
                googleCaptchaSiteKey={googleCaptchaSiteKey}
                searchUser={mockSearchUser}
                onSuccess={mockOnSuccess}
            />
        );

        fireEvent.change(screen.getByPlaceholderText('Enter Email ID / Mobile Number'), { target: { value: '9876543210' } });
        fireEvent.change(screen.getByPlaceholderText('Enter name'), { target: { value: 'Test User' } });

        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        await waitFor(() => {
            expect(mockSearchUser).toHaveBeenCalledWith({
                identifier: '9876543210',
                name: 'Test User',
                captchaResponse: 'mock-token'
            });
        });

        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalledWith([{ id: 'user-123', type: 'phone', value: '9876543210' }]);
        });
    });

    it('handles successful search with email', async () => {
        const mockResponse = {
            data: {
                response: {
                    content: [{ id: 'user-123', email: 'test@test.com' }]
                }
            }
        };
        mockSearchUser.mockResolvedValue(mockResponse);

        render(
            <IdentifyUser
                googleCaptchaSiteKey={googleCaptchaSiteKey}
                searchUser={mockSearchUser}
                onSuccess={mockOnSuccess}
            />
        );

        fireEvent.change(screen.getByPlaceholderText('Enter Email ID / Mobile Number'), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('Enter name'), { target: { value: 'Test User' } });

        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        await waitFor(() => {
            expect(mockSearchUser).toHaveBeenCalledWith({
                identifier: 'test@test.com',
                name: 'Test User',
                captchaResponse: 'mock-token'
            });
        });
    });

    it('shows error message when no user found', async () => {
        const mockResponse = {
            data: {
                response: {
                    content: []
                }
            }
        };
        mockSearchUser.mockResolvedValue(mockResponse);

        render(
            <IdentifyUser
                googleCaptchaSiteKey={googleCaptchaSiteKey}
                searchUser={mockSearchUser}
                onSuccess={mockOnSuccess}
            />
        );

        fireEvent.change(screen.getByPlaceholderText('Enter Email ID / Mobile Number'), { target: { value: '9876543210' } });
        fireEvent.change(screen.getByPlaceholderText('Enter name'), { target: { value: 'Unknown' } });

        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        await waitFor(() => {
            expect(screen.getByText('Email / mobile number or name does not match')).toBeInTheDocument();
        });
    });

    it('handles captcha validation failure (418 status)', async () => {
        const mockResponse = {
            status: 418,
            data: {}
        };
        mockSearchUser.mockResolvedValue(mockResponse);

        render(
            <IdentifyUser
                googleCaptchaSiteKey={googleCaptchaSiteKey}
                searchUser={mockSearchUser}
                onSuccess={mockOnSuccess}
            />
        );

        fireEvent.change(screen.getByPlaceholderText('Enter Email ID / Mobile Number'), { target: { value: '9876543210' } });
        fireEvent.change(screen.getByPlaceholderText('Enter name'), { target: { value: 'Test User' } });

        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        await waitFor(() => {
            expect(screen.getByText('Captcha validation failed')).toBeInTheDocument();
        });
    });
});
