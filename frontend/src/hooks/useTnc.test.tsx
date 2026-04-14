import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAcceptTnc, useGetTncUrl, useTncCheck } from './useTnc';
import React from 'react';

// Mock the TncService with methods defined in the factory
vi.mock('@/services/TncService', () => {
    // Create mock functions inside the factory to avoid hoisting issues
    const mockAcceptTnc = vi.fn();
    const mockGetTncUrl = vi.fn();
    const mockGetLatestVersion = vi.fn();
    
    class MockTncService {
        acceptTnc = mockAcceptTnc;
        getTncUrl = mockGetTncUrl;
        getLatestVersion = mockGetLatestVersion;
    }
    
    // Expose the mocks so tests can access them
    (MockTncService as any).mockAcceptTnc = mockAcceptTnc;
    (MockTncService as any).mockGetTncUrl = mockGetTncUrl;
    (MockTncService as any).mockGetLatestVersion = mockGetLatestVersion;
    
    return {
        TncService: MockTncService,
    };
});

// Import the service to get access to the mocks
import { TncService } from '@/services/TncService';
const mockAcceptTnc = (TncService as any).mockAcceptTnc;
const mockGetTncUrl = (TncService as any).mockGetTncUrl;
const mockGetLatestVersion = (TncService as any).mockGetLatestVersion;

describe('useTnc hooks', () => {
    let queryClient: QueryClient;
    let wrapper: React.FC<{ children: React.ReactNode }>;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });
        wrapper = ({ children }) => (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
        vi.clearAllMocks();
    });

    describe('useAcceptTnc', () => {
        const tncConfig = {
            data: {
                response: {
                    value: { latestVersion: 'v1' }
                }
            }
        };

        it('successfully accepts TNC without optional params', async () => {
            mockAcceptTnc.mockResolvedValue({ data: { success: true } });

            const { result } = renderHook(() => useAcceptTnc(), { wrapper });

            result.current.mutate({ tncConfig });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(mockAcceptTnc).toHaveBeenCalledWith(tncConfig, undefined, undefined);
            expect(result.current.data).toEqual({ data: { success: true } });
        });

        it('passes identifier to the service', async () => {
            mockAcceptTnc.mockResolvedValue({ data: { success: true } });

            const { result } = renderHook(() => useAcceptTnc(), { wrapper });

            result.current.mutate({ tncConfig, identifier: 'user@example.com' });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(mockAcceptTnc).toHaveBeenCalledWith(tncConfig, 'user@example.com', undefined);
        });

        it('passes tncType to the service', async () => {
            mockAcceptTnc.mockResolvedValue({ data: { success: true } });

            const { result } = renderHook(() => useAcceptTnc(), { wrapper });

            result.current.mutate({ tncConfig, tncType: 'orgAdminTnc' });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(mockAcceptTnc).toHaveBeenCalledWith(tncConfig, undefined, 'orgAdminTnc');
        });

        it('handles error when accepting TNC fails', async () => {
            const mockError = new Error('Failed to accept TNC');
            mockAcceptTnc.mockRejectedValue(mockError);

            const { result } = renderHook(() => useAcceptTnc(), { wrapper });

            result.current.mutate({ tncConfig });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error).toEqual(mockError);
        });

        it('tracks loading state correctly', async () => {
            mockAcceptTnc.mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
            );

            const { result } = renderHook(() => useAcceptTnc(), { wrapper });

            expect(result.current.isPending).toBe(false);

            result.current.mutate({ tncConfig });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.isPending).toBe(false);
        });
    });

    describe('useGetTncUrl', () => {
        it('returns TNC URL when config is valid', async () => {
            mockGetTncUrl.mockReturnValue('https://example.com/terms');

            const tncConfig = {
                data: {
                    response: {
                        value: {
                            latestVersion: 'v1',
                            v1: { url: 'https://example.com/terms' }
                        }
                    }
                }
            };

            const { result } = renderHook(() => useGetTncUrl(tncConfig), { wrapper });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(mockGetTncUrl).toHaveBeenCalledWith(tncConfig);
            expect(result.current.data).toBe('https://example.com/terms');
        });

        it('does not fetch when config is null', () => {
            const { result } = renderHook(() => useGetTncUrl(null), { wrapper });

            expect(result.current.isPending).toBe(true);
            expect(result.current.fetchStatus).toBe('idle');
            expect(mockGetTncUrl).not.toHaveBeenCalled();
        });

        it('does not fetch when config is undefined', () => {
            const { result } = renderHook(() => useGetTncUrl(undefined), { wrapper });

            expect(result.current.isPending).toBe(true);
            expect(result.current.fetchStatus).toBe('idle');
            expect(mockGetTncUrl).not.toHaveBeenCalled();
        });

        it('refetches when config changes', async () => {
            mockGetTncUrl
                .mockReturnValueOnce('https://example.com/terms-v1')
                .mockReturnValueOnce('https://example.com/terms-v2');

            const tncConfigV1: any = {
                data: {
                    response: {
                        value: {
                            latestVersion: 'v1',
                            v1: { url: 'https://example.com/terms-v1' }
                        }
                    }
                }
            };

            const { result, rerender } = renderHook(
                ({ config }: { config: any }) => useGetTncUrl(config),
                { 
                    wrapper,
                    initialProps: { config: tncConfigV1 }
                }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toBe('https://example.com/terms-v1');

            const tncConfigV2: any = {
                data: {
                    response: {
                        value: {
                            latestVersion: 'v2',
                            v2: { url: 'https://example.com/terms-v2' }
                        }
                    }
                }
            };

            rerender({ config: tncConfigV2 });

            await waitFor(() => {
                expect(result.current.data).toBe('https://example.com/terms-v2');
            });

            expect(mockGetTncUrl).toHaveBeenCalledTimes(2);
        });

        it('returns empty string when getTncUrl returns empty', async () => {
            mockGetTncUrl.mockReturnValue('');

            const tncConfig = {
                data: {
                    response: {
                        value: {}
                    }
                }
            };

            const { result } = renderHook(() => useGetTncUrl(tncConfig), { wrapper });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toBe('');
        });
    });

    describe('useTncCheck', () => {
        it('returns needsTncAcceptance true when user has never accepted', () => {
            mockGetLatestVersion.mockReturnValue('v1');
            mockGetTncUrl.mockReturnValue('https://example.com/terms');

            const userProfile = {};
            const tncConfig = { data: { response: { value: { latestVersion: 'v1' } } } };

            const { result } = renderHook(() => useTncCheck(userProfile, tncConfig), { wrapper });

            expect(result.current.needsTncAcceptance).toBe(true);
            expect(result.current.latestVersion).toBe('v1');
            expect(result.current.termsUrl).toBe('https://example.com/terms');
        });

        it('returns needsTncAcceptance true when version is outdated', () => {
            mockGetLatestVersion.mockReturnValue('v2');
            mockGetTncUrl.mockReturnValue('https://example.com/terms-v2');

            const userProfile = { tncAcceptedVersion: 'v1' };
            const tncConfig = { data: { response: { value: { latestVersion: 'v2' } } } };

            const { result } = renderHook(() => useTncCheck(userProfile, tncConfig), { wrapper });

            expect(result.current.needsTncAcceptance).toBe(true);
        });

        it('returns needsTncAcceptance false when version matches', () => {
            mockGetLatestVersion.mockReturnValue('v1');
            mockGetTncUrl.mockReturnValue('https://example.com/terms');

            const userProfile = { tncAcceptedVersion: 'v1' };
            const tncConfig = { data: { response: { value: { latestVersion: 'v1' } } } };

            const { result } = renderHook(() => useTncCheck(userProfile, tncConfig), { wrapper });

            expect(result.current.needsTncAcceptance).toBe(false);
        });

        it('returns needsTncAcceptance false when tncConfig is null', () => {
            mockGetLatestVersion.mockReturnValue('');
            mockGetTncUrl.mockReturnValue('');

            const userProfile = {};

            const { result } = renderHook(() => useTncCheck(userProfile, null), { wrapper });

            expect(result.current.needsTncAcceptance).toBe(false);
            expect(result.current.latestVersion).toBe('');
            expect(result.current.termsUrl).toBe('');
        });

        it('returns needsTncAcceptance false when userProfile is null', () => {
            mockGetLatestVersion.mockReturnValue('v1');
            mockGetTncUrl.mockReturnValue('https://example.com/terms');

            const tncConfig = { data: { response: { value: { latestVersion: 'v1' } } } };

            const { result } = renderHook(() => useTncCheck(null, tncConfig), { wrapper });

            expect(result.current.needsTncAcceptance).toBe(false);
        });
    });
});
