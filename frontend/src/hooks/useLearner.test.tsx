import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    useLearnerFuzzySearch,
    useGenerateOtp,
    useVerifyOtp,
    useResetPassword
} from './useLearner';
import React from 'react';

// Use vi.hoisted to create mocks that can be used in vi.mock and tests
const { mockOtpService, mockUserService } = vi.hoisted(() => ({
    mockOtpService: {
        generateOtp: vi.fn(),
        verifyOtp: vi.fn(),
    },
    mockUserService: {
        fuzzyUserSearch: vi.fn(),
        resetPassword: vi.fn()
    }
}));

vi.mock('../services/OtpService', () => ({
    OtpService: vi.fn(function () {
        return mockOtpService;
    })
}));

vi.mock('../services/UserService', () => ({
    UserService: vi.fn(function () {
        return mockUserService;
    })
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
    }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useLearner hooks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('useLearnerFuzzySearch calls service', async () => {
        const { result } = renderHook(() => useLearnerFuzzySearch(), { wrapper });
        const request = { name: 'test' };

        mockUserService.fuzzyUserSearch.mockResolvedValue({ data: 'success' });

        await result.current.mutateAsync({ request });

        expect(mockUserService.fuzzyUserSearch).toHaveBeenCalled();
    });

    it('useGenerateOtp calls service', async () => {
        const { result } = renderHook(() => useGenerateOtp(), { wrapper });
        const request = { userId: 'u1' };

        mockOtpService.generateOtp.mockResolvedValue({ data: 'success' });

        await result.current.mutateAsync({ request });

        expect(mockOtpService.generateOtp).toHaveBeenCalled();
    });

    it('useVerifyOtp calls service', async () => {
        const { result } = renderHook(() => useVerifyOtp(), { wrapper });
        const request = { otp: '123456' };

        mockOtpService.verifyOtp.mockResolvedValue({ data: 'success' });

        await result.current.mutateAsync({ request });

        expect(mockOtpService.verifyOtp).toHaveBeenCalled();
    });

    it('useResetPassword calls service', async () => {
        const { result } = renderHook(() => useResetPassword(), { wrapper });
        const request = { password: 'new' };

        mockUserService.resetPassword.mockResolvedValue({ data: 'success' });

        await result.current.mutateAsync({ request });

        expect(mockUserService.resetPassword).toHaveBeenCalled();
    });
});

