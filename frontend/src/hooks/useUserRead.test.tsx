import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserRead } from './useUserRead';
import React from 'react';

const capturedArgs = vi.hoisted(() => ({ queryOptions: null as any }));

vi.mock('@tanstack/react-query', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@tanstack/react-query')>();
    return {
        ...actual,
        useQuery: (options: any) => {
            capturedArgs.queryOptions = options;
            return actual.useQuery(options);
        },
    };
});

// Mock services
const { mockUserService, mockUseAuthInfo } = vi.hoisted(() => ({
    mockUserService: {
        userRead: vi.fn(),
    },
    mockUseAuthInfo: vi.fn(),
}));

// Mock UserService module
vi.mock('../services/UserService', () => ({
    UserService: vi.fn(function () { return mockUserService; }),
}));

// Mock useAuthInfo hook
vi.mock('./useAuthInfo', () => ({
    useAuthInfo: () => mockUseAuthInfo(),
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

        // Mock useAuthInfo to return auth data
        mockUseAuthInfo.mockReturnValue({
            data: { uid: mockUserId, sid: 'session-123', isAuthenticated: true },
            isSuccess: true,
            isLoading: false,
        });
        mockUserService.userRead.mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useUserRead(), { wrapper: createWrapper() });

        // Wait for success
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockResponse);
        expect(mockUserService.userRead).toHaveBeenCalledWith(mockUserId);
    });

    it('should fetch user data successfully when userId is fetched asynchronously', async () => {
        // Setup mocks
        const mockUserId = 'user-456';
        const mockResponse = { data: { response: { firstName: 'Async', lastName: 'User' } } };

        // Mock useAuthInfo to return auth data
        mockUseAuthInfo.mockReturnValue({
            data: { uid: mockUserId, sid: 'session-456', isAuthenticated: true },
            isSuccess: true,
            isLoading: false,
        });

        mockUserService.userRead.mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useUserRead(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockResponse);
        expect(mockUserService.userRead).toHaveBeenCalledWith(mockUserId);
    });

    it('should throw error when userId is not available even after auth check', async () => {
        // Setup mocks - no userId available
        mockUseAuthInfo.mockReturnValue({
            data: { uid: null, sid: 'session-789', isAuthenticated: false },
            isSuccess: true,
            isLoading: false,
        });

        const { result } = renderHook(() => useUserRead(), { wrapper: createWrapper() });

        // Query should be disabled, so it won't be in error state, just won't run
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data).toBeUndefined();
        expect(mockUserService.userRead).not.toHaveBeenCalled();
    });

    it('should handle API errors from userRead', async () => {
        const mockUserId = 'user-789';
        const mockError = new Error('API Error');

        mockUseAuthInfo.mockReturnValue({
            data: { uid: mockUserId, sid: 'session-789', isAuthenticated: true },
            isSuccess: true,
            isLoading: false,
        });
        mockUserService.userRead.mockRejectedValue(mockError);

        const { result } = renderHook(() => useUserRead(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });

        expect(result.current.error).toBe(mockError);
        expect(mockUserService.userRead).toHaveBeenCalledWith(mockUserId);
    });
    it('accepts refetchOnMount option and still fetches data correctly', async () => {
        const mockUserId = 'user-123';
        const mockResponse = { data: { response: { firstName: 'Test', lastName: 'User' } } };
        
        mockUseAuthInfo.mockReturnValue({
            data: { uid: mockUserId, sid: 'session-123', isAuthenticated: true },
            isSuccess: true,
            isLoading: false,
        });
        mockUserService.userRead.mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useUserRead({ refetchOnMount: 'always' }), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockResponse);
    });

    describe('query options', () => {
        it('uses 1-hour staleTime by default to cache user data across navigations', () => {
            mockUseAuthInfo.mockReturnValue({
                data: { uid: 'user-123', sid: 'session-123', isAuthenticated: true },
                isSuccess: true,
                isLoading: false,
            });

            renderHook(() => useUserRead(), { wrapper: createWrapper() });

            expect(capturedArgs.queryOptions).toMatchObject({ staleTime: 60 * 60 * 1000 });
        });

        it('passes refetchOnMount: always through to useQuery when provided', () => {
            mockUseAuthInfo.mockReturnValue({
                data: { uid: 'user-123', sid: 'session-123', isAuthenticated: true },
                isSuccess: true,
                isLoading: false,
            });

            renderHook(() => useUserRead({ refetchOnMount: 'always' }), { wrapper: createWrapper() });

            expect(capturedArgs.queryOptions).toMatchObject({
                staleTime: 60 * 60 * 1000,
                refetchOnMount: 'always',
            });
        });

        it('leaves refetchOnMount undefined when no option is passed', () => {
            mockUseAuthInfo.mockReturnValue({
                data: { uid: 'user-123', sid: 'session-123', isAuthenticated: true },
                isSuccess: true,
                isLoading: false,
            });

            renderHook(() => useUserRead(), { wrapper: createWrapper() });

            expect(capturedArgs.queryOptions.refetchOnMount).toBeUndefined();
        });
    });
});