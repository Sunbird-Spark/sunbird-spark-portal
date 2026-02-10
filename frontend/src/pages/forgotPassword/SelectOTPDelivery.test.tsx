import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SelectOTPDelivery } from './SelectOTPDelivery';
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
});
