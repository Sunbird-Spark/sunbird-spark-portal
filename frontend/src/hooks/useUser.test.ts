import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
    useLearnerFuzzySearch, 
    useResetPassword, 
    useSignup
} from './useUser';
import { UserService } from '../services/UserService';
import React from 'react';

vi.mock('../services/UserService');

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    
    function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
    }
    
    return Wrapper;
};

describe('useUser hooks', () => {
    let mockUserService: any;

    beforeEach(() => {
        mockUserService = {
            searchUser: vi.fn(),
            resetPassword: vi.fn(),
            signup: vi.fn(),
        };
        vi.mocked(UserService).mockImplementation(() => mockUserService);
    });

    describe('useLearnerFuzzySearch', () => {
        it('should call searchUser with correct parameters', async () => {
            const mockResponse = { data: { users: [] }, status: 200, headers: {} };
            mockUserService.searchUser.mockResolvedValue(mockResponse);

            const { result } = renderHook(() => useLearnerFuzzySearch(), {
                wrapper: createWrapper(),
            });

            result.current.mutate({
                identifier: 'test@example.com',
                name: 'John Doe',
                captchaResponse: 'captcha-token',
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(mockUserService.searchUser).toHaveBeenCalledWith(
                'test@example.com',
                'John Doe',
                'captcha-token'
            );
        });
    });

    describe('useResetPassword', () => {
        it('should call resetPassword with correct parameters', async () => {
            const mockResponse = { data: { success: true }, status: 200, headers: {} };
            mockUserService.resetPassword.mockResolvedValue(mockResponse);

            const { result } = renderHook(() => useResetPassword(), {
                wrapper: createWrapper(),
            });

            const request = { key: 'test@example.com', password: 'NewPass123!' };
            result.current.mutate({ request });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(mockUserService.resetPassword).toHaveBeenCalledWith(request);
        });
    });

    describe('useSignup', () => {
        it('should call signup with correct parameters', async () => {
            const mockResponse = { data: { userId: 'user123' }, status: 200, headers: {} };
            mockUserService.signup.mockResolvedValue(mockResponse);

            const { result } = renderHook(() => useSignup(), {
                wrapper: createWrapper(),
            });

            result.current.mutate({
                firstName: 'John',
                identifier: 'test@example.com',
                password: 'Password123!',
                deviceId: 'device-123',
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(mockUserService.signup).toHaveBeenCalledWith(
                'John',
                'test@example.com',
                'Password123!',
                'device-123'
            );
        });

        it('should handle signup without deviceId', async () => {
            const mockResponse = { data: { userId: 'user123' }, status: 200, headers: {} };
            mockUserService.signup.mockResolvedValue(mockResponse);

            const { result } = renderHook(() => useSignup(), {
                wrapper: createWrapper(),
            });

            result.current.mutate({
                firstName: 'Jane',
                identifier: 'test@example.com',
                password: 'Password123!',
            });

            await waitFor(() => expect(result.current.isSuccess).toBe(true));

            expect(mockUserService.signup).toHaveBeenCalledWith(
                'Jane',
                'test@example.com',
                'Password123!',
                undefined
            );
        });
    });
});
