import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from './UserService';
import { getClient } from '../lib/http-client';

// Mock getClient
vi.mock('../lib/http-client', () => ({
    getClient: vi.fn()
}));

describe('UserService', () => {
    let userService: UserService;
    const mockPost = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (getClient as any).mockReturnValue({
            post: mockPost
        });
        userService = new UserService();
    });

    it('should call fuzzyUserSearch with correct endpoint and payload', async () => {
        const request = { name: 'John' };
        await userService.fuzzyUserSearch(request);
        expect(mockPost).toHaveBeenCalledWith('/user/v1/fuzzy/search', request);
    });

    it('should call fuzzyUserSearch with captchaResponse when provided', async () => {
        const request = { name: 'John' };
        const captchaResponse = 'mock-captcha';
        await userService.fuzzyUserSearch(request, captchaResponse);
        expect(mockPost).toHaveBeenCalledWith(`/user/v1/fuzzy/search?captchaResponse=${captchaResponse}`, request);
    });

    it('should call resetPassword with correct endpoint and payload', async () => {
        const request = { password: 'New' };
        await userService.resetPassword(request);
        expect(mockPost).toHaveBeenCalledWith('/user/v1/password/reset', request);
    });
});
