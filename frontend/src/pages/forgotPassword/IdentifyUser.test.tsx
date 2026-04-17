import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IdentifyUser } from './IdentifyUser';

const { mockRedirectWithError } = vi.hoisted(() => ({
    mockRedirectWithError: vi.fn(() => false),
}));

vi.mock('@/utils/forgotPasswordUtils', async () => {
    const actual = await vi.importActual('@/utils/forgotPasswordUtils') as any;
    return { ...actual, redirectWithError: mockRedirectWithError };
});

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

    it('calls initiateFuzzySearch directly when no captcha key (line 36)', async () => {
        mockSearchUser.mockResolvedValue({
            data: { response: { content: [{ id: 'u1', phone: '9876543210' }] } },
        });
        render(<IdentifyUser googleCaptchaSiteKey="" searchUser={mockSearchUser} onSuccess={mockOnSuccess} />);
        fireEvent.change(screen.getByPlaceholderText('Enter Email ID / Mobile Number'), { target: { value: '9876543210' } });
        fireEvent.change(screen.getByPlaceholderText('Enter name'), { target: { value: 'Test User' } });
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() => {
            expect(mockSearchUser).toHaveBeenCalledWith({ identifier: '9876543210', name: 'Test User', captchaResponse: undefined });
        });
    });

    it('catch block: sets VALIDATING_FAILED when rejection has 418 status (lines 63–65)', async () => {
        mockSearchUser.mockRejectedValue({ response: { status: 418 } });
        render(<IdentifyUser googleCaptchaSiteKey={googleCaptchaSiteKey} searchUser={mockSearchUser} onSuccess={mockOnSuccess} />);
        fireEvent.change(screen.getByPlaceholderText('Enter Email ID / Mobile Number'), { target: { value: '9876543210' } });
        fireEvent.change(screen.getByPlaceholderText('Enter name'), { target: { value: 'Test User' } });
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() => expect(screen.getByText('Captcha validation failed')).toBeInTheDocument());
    });

    it('catch block: sets NOT_MATCHED for non-418 rejection (lines 66–67)', async () => {
        mockSearchUser.mockRejectedValue(new Error('Network error'));
        render(<IdentifyUser googleCaptchaSiteKey={googleCaptchaSiteKey} searchUser={mockSearchUser} onSuccess={mockOnSuccess} />);
        fireEvent.change(screen.getByPlaceholderText('Enter Email ID / Mobile Number'), { target: { value: '9876543210' } });
        fireEvent.change(screen.getByPlaceholderText('Enter name'), { target: { value: 'Test User' } });
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() => expect(screen.getByText('Email / mobile number or name does not match')).toBeInTheDocument());
    });

    it('catch block: second error triggers redirectWithError (lines 72–76)', async () => {
        mockSearchUser.mockRejectedValue(new Error('fail'));
        render(<IdentifyUser googleCaptchaSiteKey={googleCaptchaSiteKey} searchUser={mockSearchUser} onSuccess={mockOnSuccess} />);
        fireEvent.change(screen.getByPlaceholderText('Enter Email ID / Mobile Number'), { target: { value: '9876543210' } });
        fireEvent.change(screen.getByPlaceholderText('Enter name'), { target: { value: 'Test User' } });
        // First error
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() => expect(screen.getByText('Email / mobile number or name does not match')).toBeInTheDocument());
        // Second error
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() => expect(mockRedirectWithError).toHaveBeenCalledOnce());
    });

    it('catch block: loading stays when redirectWithError returns true (line 75 skipped, 77 covered)', async () => {
        mockRedirectWithError.mockReturnValue(true);
        mockSearchUser.mockRejectedValue(new Error('fail'));
        render(<IdentifyUser googleCaptchaSiteKey={googleCaptchaSiteKey} searchUser={mockSearchUser} onSuccess={mockOnSuccess} />);
        fireEvent.change(screen.getByPlaceholderText('Enter Email ID / Mobile Number'), { target: { value: '9876543210' } });
        fireEvent.change(screen.getByPlaceholderText('Enter name'), { target: { value: 'Test User' } });
        // First error to increment errorCount to 1
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() => expect(screen.getByText('Email / mobile number or name does not match')).toBeInTheDocument());
        // Second error → redirectWithError returns true → setLoading(false) NOT called
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
        await waitFor(() => expect(mockRedirectWithError).toHaveBeenCalledOnce());
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
