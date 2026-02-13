import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserRead } from './useUserRead';
import React from 'react';

// Mock services
const { mockUserService, mockUserAuthInfoService } = vi.hoisted(() => ({
    mockUserService: {
        userRead: vi.fn(),
    },
    mockUserAuthInfoService: {
        getUserId: vi.fn(),
        getAuthInfo: vi.fn(),
    }
}));

// Mock UserService module
vi.mock('../services/UserService', () => ({
    UserService: vi.fn(function () { return mockUserService; }),
}));

// Mock userAuthInfoService module
vi.mock('../services/userAuthInfoService/userAuthInfoService', () => ({
    default: mockUserAuthInfoService,
}));

// Setup QueryClient wrapper
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false, // Disable retries for faster failure in tests
            },
        },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useUserRead hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch user data successfully when userId is available synchronously', async () => {
        // Setup mocks
        const mockUserId = 'user-123';
        const mockResponse = { data: { response: { firstName: 'Test', lastName: 'User' } } };

        // Simulate userId already cached
        mockUserAuthInfoService.getUserId.mockReturnValue(mockUserId);
        mockUserService.userRead.mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useUserRead(), { wrapper: createWrapper() });

        // Wait for success
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockResponse);
        expect(mockUserAuthInfoService.getUserId).toHaveBeenCalled();
        expect(mockUserAuthInfoService.getAuthInfo).not.toHaveBeenCalled(); // optimized path
        expect(mockUserService.userRead).toHaveBeenCalledWith(mockUserId);
    });

    it('should fetch user data successfully when userId is fetched asynchronously', async () => {
        // Setup mocks
        const mockUserId = 'user-456';
        const mockResponse = { data: { response: { firstName: 'Async', lastName: 'User' } } };

        // Simulate no cached userId initially
        mockUserAuthInfoService.getUserId.mockReturnValue(null);
        // Simulate successful auth fetch
        mockUserAuthInfoService.getAuthInfo.mockResolvedValue({ uid: mockUserId });

        mockUserService.userRead.mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useUserRead(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockResponse);
        expect(mockUserAuthInfoService.getUserId).toHaveBeenCalled();
        expect(mockUserAuthInfoService.getAuthInfo).toHaveBeenCalled(); // fallback path
        expect(mockUserService.userRead).toHaveBeenCalledWith(mockUserId);
    });

    it('should throw error when userId is not available even after auth check', async () => {
        // Setup mocks
        mockUserAuthInfoService.getUserId.mockReturnValue(null);
        mockUserAuthInfoService.getAuthInfo.mockResolvedValue({ uid: null });

        const { result } = renderHook(() => useUserRead(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('User ID not available');
        expect(mockUserService.userRead).not.toHaveBeenCalled();
    });

    it('should handle API errors from userRead', async () => {
        const mockUserId = 'user-789';
        const mockError = new Error('API Error');

        mockUserAuthInfoService.getUserId.mockReturnValue(mockUserId);
        mockUserService.userRead.mockRejectedValue(mockError);

        const { result } = renderHook(() => useUserRead(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });

        expect(result.current.error).toBe(mockError);
        expect(mockUserService.userRead).toHaveBeenCalledWith(mockUserId);
    });
});
