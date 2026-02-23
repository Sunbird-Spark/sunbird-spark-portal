import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OtpService } from './OtpService';
import { getClient } from '../lib/http-client';

// Mock getClient
vi.mock('../lib/http-client', () => ({
    getClient: vi.fn()
}));

describe('OtpService', () => {
    let otpService: OtpService;
    const mockPost = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (getClient as import('vitest').Mock).mockReturnValue({
            post: mockPost
        });
        otpService = new OtpService();
    });

    it('should call generateOtp with correct endpoint and payload', async () => {
        const request = { userId: 'u123' };
        await otpService.generateOtp(request);
        expect(mockPost).toHaveBeenCalledWith('/otp/v1/generate', request);
    });

    it('should call generateOtp with captchaResponse when provided', async () => {
        const request = { userId: 'u123' };
        const captchaResponse = 'mock-captcha';
        await otpService.generateOtp(request, captchaResponse);
        expect(mockPost).toHaveBeenCalledWith(`/otp/v1/generate?captchaResponse=${captchaResponse}`, request);
    });

    it('should call verifyOtp with correct endpoint and payload', async () => {
        const request = { otp: '123456' };
        await otpService.verifyOtp(request);
        expect(mockPost).toHaveBeenCalledWith('/otp/v1/verify', request);
    });
});
