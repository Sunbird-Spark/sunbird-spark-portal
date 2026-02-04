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

// Use vi.hoisted to create a mock that can be used in vi.mock and tests
const { mockLearnerService } = vi.hoisted(() => ({
    mockLearnerService: {
        fuzzyUserSearch: vi.fn(),
        generateOtp: vi.fn(),
        verifyOtp: vi.fn(),
        resetPassword: vi.fn()
    }
}));

vi.mock('../services/LearnerService', () => ({
    LearnerService: vi.fn(function () {
        return mockLearnerService;
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

        mockLearnerService.fuzzyUserSearch.mockResolvedValue({ data: 'success' });

        await result.current.mutateAsync({ request });

        expect(mockLearnerService.fuzzyUserSearch).toHaveBeenCalled();
    });

    it('useGenerateOtp calls service', async () => {
        const { result } = renderHook(() => useGenerateOtp(), { wrapper });
        const request = { userId: 'u1' };

        mockLearnerService.generateOtp.mockResolvedValue({ data: 'success' });

        await result.current.mutateAsync({ request });

        expect(mockLearnerService.generateOtp).toHaveBeenCalled();
    });

    it('useVerifyOtp calls service', async () => {
        const { result } = renderHook(() => useVerifyOtp(), { wrapper });
        const request = { otp: '123456' };

        mockLearnerService.verifyOtp.mockResolvedValue({ data: 'success' });

        await result.current.mutateAsync({ request });

        expect(mockLearnerService.verifyOtp).toHaveBeenCalled();
    });

    it('useResetPassword calls service', async () => {
        const { result } = renderHook(() => useResetPassword(), { wrapper });
        const request = { password: 'new' };

        mockLearnerService.resetPassword.mockResolvedValue({ data: 'success' });

        await result.current.mutateAsync({ request });

        expect(mockLearnerService.resetPassword).toHaveBeenCalled();
    });
});
