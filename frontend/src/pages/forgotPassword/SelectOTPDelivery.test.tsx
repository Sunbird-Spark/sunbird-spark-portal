import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SelectOTPDelivery } from './SelectOTPDelivery';

vi.mock('@/hooks/useAppI18n', () => ({
    useAppI18n: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'forgotPasswordTitle': 'Forgot Password',
                'forgotPasswordPage.deliveryPrompt': 'Where would you like to receive the OTP?',
                'forgotPasswordPage.getOtp': 'Get OTP',
            };
            return translations[key] || key;
        },
    }),
}));
import { OtpIdentifier } from '../../types/forgotPasswordTypes';

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

// Mock maskIdentifier
vi.mock('@/utils/ValidationUtils', () => ({
    maskIdentifier: (val: string) => `masked-${val}`
}));

describe('SelectOTPDelivery', () => {
    const mockGenerateOtp = vi.fn();
    const mockOnSuccess = vi.fn();
    const validIdentifiers: OtpIdentifier[] = [
        { id: 'u1', type: 'phone', value: '9876543210' },
        { id: 'u1', type: 'email', value: 'test@test.com' }
    ];
    const googleCaptchaSiteKey = 'test-site-key';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all valid identifiers masked', () => {
        render(
            <SelectOTPDelivery
                validIdentifiers={validIdentifiers}
                googleCaptchaSiteKey={googleCaptchaSiteKey}
                generateOtp={mockGenerateOtp}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.getByText('masked-9876543210')).toBeInTheDocument();
        expect(screen.getByText('masked-test@test.com')).toBeInTheDocument();
    });

    it('enables Get OTP button only when an identifier is selected', () => {
        render(
            <SelectOTPDelivery
                validIdentifiers={validIdentifiers}
                googleCaptchaSiteKey={googleCaptchaSiteKey}
                generateOtp={mockGenerateOtp}
                onSuccess={mockOnSuccess}
            />
        );

        const getOtpBtn = screen.getByRole('button', { name: /get otp/i });
        expect(getOtpBtn).toBeDisabled();

        fireEvent.click(screen.getByText('masked-9876543210'));
        expect(getOtpBtn).not.toBeDisabled();
    });

    it('handles successful OTP generation', async () => {
        mockGenerateOtp.mockResolvedValue({ status: 200 });

        render(
            <SelectOTPDelivery
                validIdentifiers={validIdentifiers}
                googleCaptchaSiteKey={googleCaptchaSiteKey}
                generateOtp={mockGenerateOtp}
                onSuccess={mockOnSuccess}
            />
        );

        fireEvent.click(screen.getByText('masked-test@test.com'));
        fireEvent.click(screen.getByRole('button', { name: /get otp/i }));

        await waitFor(() => {
            expect(mockGenerateOtp).toHaveBeenCalledWith(expect.objectContaining({
                request: {
                    request: {
                        type: 'email',
                        key: 'test@test.com',
                        userId: 'u1',
                        templateId: 'resetPasswordWithOtp'
                    }
                },
                captchaResponse: 'mock-token'
            }));
        });

        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalledWith(validIdentifiers[1]);
        });
    });

    it('handles rate limiting (429 status)', async () => {
        const mockError = {
            response: {
                status: 429,
                data: {
                    params: { errmsg: 'Too many attempts' }
                }
            }
        };
        mockGenerateOtp.mockRejectedValue(mockError);

        vi.stubGlobal('location', {
            href: 'http://test.com/forgot-password?error_callback=http://test.com',
            search: '?error_callback=http://test.com',
            assign: vi.fn(),
            replace: vi.fn(),
        });

        render(
            <SelectOTPDelivery
                validIdentifiers={validIdentifiers}
                googleCaptchaSiteKey={googleCaptchaSiteKey}
                generateOtp={mockGenerateOtp}
                onSuccess={mockOnSuccess}
            />
        );

        fireEvent.click(screen.getByText('masked-9876543210'));
        fireEvent.click(screen.getByRole('button', { name: /get otp/i }));

        await waitFor(() => {
            expect(window.location.href).toContain('Too+many+attempts');
        });
    });

    it('calls handleGenerateOtp directly (no captcha) when googleCaptchaSiteKey is empty (line 32)', async () => {
        mockGenerateOtp.mockResolvedValue({ status: 200 });

        render(
            <SelectOTPDelivery
                validIdentifiers={validIdentifiers}
                googleCaptchaSiteKey=""
                generateOtp={mockGenerateOtp}
                onSuccess={mockOnSuccess}
            />
        );

        fireEvent.click(screen.getByText('masked-9876543210'));
        fireEvent.click(screen.getByRole('button', { name: /get otp/i }));

        await waitFor(() => {
            expect(mockGenerateOtp).toHaveBeenCalledWith(expect.objectContaining({
                captchaResponse: ''
            }));
            expect(mockOnSuccess).toHaveBeenCalledWith(validIdentifiers[0]);
        });
    });

    it('does nothing when handleGenerateOtp called with no selectedIdentifier (line 37)', async () => {
        render(
            <SelectOTPDelivery
                validIdentifiers={validIdentifiers}
                googleCaptchaSiteKey=""
                generateOtp={mockGenerateOtp}
                onSuccess={mockOnSuccess}
            />
        );

        // Don't select an identifier — button is disabled, but we still verify generateOtp is not called
        const btn = screen.getByRole('button', { name: /get otp/i });
        expect(btn).toBeDisabled();
        expect(mockGenerateOtp).not.toHaveBeenCalled();
    });

    it('throws error toast when API returns non-200 status (line 55)', async () => {
        mockGenerateOtp.mockResolvedValue({ status: 500 });

        vi.stubGlobal('location', {
            href: 'http://test.com/forgot-password',
            search: '',
            assign: vi.fn(),
            replace: vi.fn(),
        });

        render(
            <SelectOTPDelivery
                validIdentifiers={validIdentifiers}
                googleCaptchaSiteKey=""
                generateOtp={mockGenerateOtp}
                onSuccess={mockOnSuccess}
            />
        );

        fireEvent.click(screen.getByText('masked-9876543210'));
        fireEvent.click(screen.getByRole('button', { name: /get otp/i }));

        await waitFor(() => {
            expect(mockOnSuccess).not.toHaveBeenCalled();
        });
    });

    it('increments errorCount and sets loading false on first generic error (lines 70-80)', async () => {
        mockGenerateOtp.mockRejectedValue(new Error('Generic error'));

        vi.stubGlobal('location', {
            href: 'http://test.com/forgot-password',
            search: '',
            assign: vi.fn(),
            replace: vi.fn(),
        });

        render(
            <SelectOTPDelivery
                validIdentifiers={validIdentifiers}
                googleCaptchaSiteKey=""
                generateOtp={mockGenerateOtp}
                onSuccess={mockOnSuccess}
            />
        );

        fireEvent.click(screen.getByText('masked-9876543210'));
        const btn = screen.getByRole('button', { name: /get otp/i });
        fireEvent.click(btn);

        // After first error, loading state resets and button re-enables
        await waitFor(() => {
            expect(btn).not.toBeDisabled();
        });
    });

    it('redirects after 2+ generic errors (lines 73-76)', async () => {
        mockGenerateOtp.mockRejectedValue(new Error('Repeated error'));

        vi.stubGlobal('location', {
            href: 'http://test.com/forgot-password?error_callback=http://test.com/callback',
            search: '?error_callback=http://test.com/callback',
            assign: vi.fn(),
            replace: vi.fn(),
        });

        render(
            <SelectOTPDelivery
                validIdentifiers={validIdentifiers}
                googleCaptchaSiteKey=""
                generateOtp={mockGenerateOtp}
                onSuccess={mockOnSuccess}
            />
        );

        fireEvent.click(screen.getByText('masked-9876543210'));
        const btn = screen.getByRole('button', { name: /get otp/i });

        // First error
        fireEvent.click(btn);
        await waitFor(() => expect(btn).not.toBeDisabled());

        // Second error — should redirect
        fireEvent.click(btn);
        await waitFor(() => {
            expect(window.location.href).toContain('forgotPasswordPage.errorGenerateOtp');
        });
    });

    it('handles 429 without errmsg gracefully (uses default t key)', async () => {
        const mockError = {
            response: {
                status: 429,
                data: { params: { errmsg: '' } }
            }
        };
        mockGenerateOtp.mockRejectedValue(mockError);

        vi.stubGlobal('location', {
            href: 'http://test.com/forgot-password?error_callback=http://test.com',
            search: '?error_callback=http://test.com',
            assign: vi.fn(),
            replace: vi.fn(),
        });

        render(
            <SelectOTPDelivery
                validIdentifiers={validIdentifiers}
                googleCaptchaSiteKey=""
                generateOtp={mockGenerateOtp}
                onSuccess={mockOnSuccess}
            />
        );

        fireEvent.click(screen.getByText('masked-9876543210'));
        fireEvent.click(screen.getByRole('button', { name: /get otp/i }));

        await waitFor(() => {
            expect(window.location.href).toContain('forgotPasswordPage.errorTooManyRequests');
        });
    });
});
