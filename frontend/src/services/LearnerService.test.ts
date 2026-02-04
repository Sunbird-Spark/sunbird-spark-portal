import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LearnerService } from './LearnerService';
import { getClient } from '../lib/http-client';

// Mock getClient
vi.mock('../lib/http-client', () => ({
    getClient: vi.fn()
}));

describe('LearnerService', () => {
    let learnerService: LearnerService;
    const mockPost = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (getClient as any).mockReturnValue({
            post: mockPost
        });
        learnerService = new LearnerService();
    });

    it('should call fuzzyUserSearch with correct endpoint and payload', async () => {
        const request = { name: 'John' };
        await learnerService.fuzzyUserSearch(request);
        expect(mockPost).toHaveBeenCalledWith('/user/v1/fuzzy/search', request);
    });

    it('should call fuzzyUserSearch with captchaResponse when provided', async () => {
        const request = { name: 'John' };
        const captchaResponse = 'mock-captcha';
        await learnerService.fuzzyUserSearch(request, captchaResponse);
        expect(mockPost).toHaveBeenCalledWith(`/user/v1/fuzzy/search?captchaResponse=${captchaResponse}`, request);
    });

    it('should call generateOtp with correct endpoint and payload', async () => {
        const request = { userId: 'u123' };
        await learnerService.generateOtp(request);
        expect(mockPost).toHaveBeenCalledWith('/anonymous/otp/v1/generate', request);
    });

    it('should call generateOtp with captchaResponse when provided', async () => {
        const request = { userId: 'u123' };
        const captchaResponse = 'mock-captcha';
        await learnerService.generateOtp(request, captchaResponse);
        expect(mockPost).toHaveBeenCalledWith(`/anonymous/otp/v1/generate?captchaResponse=${captchaResponse}`, request);
    });

    it('should call verifyOtp with correct endpoint and payload', async () => {
        const request = { otp: '123456' };
        await learnerService.verifyOtp(request);
        expect(mockPost).toHaveBeenCalledWith('/otp/v1/verify', request);
    });

    it('should call resetPassword with correct endpoint and payload', async () => {
        const request = { password: 'New' };
        await learnerService.resetPassword(request);
        expect(mockPost).toHaveBeenCalledWith('/user/v1/password/reset', request);
    });
});
