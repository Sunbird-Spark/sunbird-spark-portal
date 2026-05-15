import { renderHook, waitFor, act } from '@testing-library/react';
import { useFaqData } from './useFaqData';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Hoist the mock function so it can be used in vi.mock
const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

// Mock HttpService
vi.mock('../services/HttpService', () => {
  return {
    HttpService: class {
      get = mockGet;
      static isCancel = (err: any) => err?.message === 'canceled';
    },
  };
});

describe('useFaqData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches data successfully for primary language', async () => {
    mockGet.mockResolvedValueOnce({ general: [] });

    const { result } = renderHook(() => useFaqData('http://base', 'es'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual({ general: [] });
    expect(result.current.error).toBeNull();
    expect(mockGet).toHaveBeenCalledWith('http://base/faq-es.json', expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('falls back to English if primary language fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('Primary failed')); // Primary 'es' fails
    mockGet.mockResolvedValueOnce({ general: ['fallback'] });   // Fallback 'en' succeeds

    const { result } = renderHook(() => useFaqData('http://base', 'es'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual({ general: ['fallback'] });
    expect(mockGet).toHaveBeenCalledWith('http://base/faq-es.json', expect.anything());
    expect(mockGet).toHaveBeenCalledWith('http://base/faq-en.json', expect.anything());
  });

  it('fails if both primary and fallback fail', async () => {
    mockGet.mockRejectedValueOnce(new Error('Primary failed'));
    mockGet.mockRejectedValueOnce(new Error('Fallback failed'));

    const { result } = renderHook(() => useFaqData('http://base', 'es'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeTruthy();
    expect(mockGet).toHaveBeenCalledWith('http://base/faq-es.json', expect.anything());
    expect(mockGet).toHaveBeenCalledWith('http://base/faq-en.json', expect.anything());
  });

  it('does not fallback if primary is already English', async () => {
    mockGet.mockRejectedValueOnce(new Error('English failed'));

    const { result } = renderHook(() => useFaqData('http://base', 'en'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeTruthy();
    expect(mockGet).toHaveBeenCalledWith('http://base/faq-en.json', expect.anything());
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('aborts request on unmount', async () => {
    let abortSignal: AbortSignal | undefined;
    mockGet.mockImplementation((url, config) => {
      abortSignal = config?.signal;
      return new Promise(() => {}); // Never resolve
    });

    const { unmount } = renderHook(() => useFaqData('http://base', 'es'));

    expect(mockGet).toHaveBeenCalled();
    expect(abortSignal).toBeDefined();
    expect(abortSignal?.aborted).toBe(false);

    unmount();

    expect(abortSignal?.aborted).toBe(true);
  });

  // --- New tests for previously uncovered lines ---

  it('sets data=null, loading=false, error=null immediately when baseUrl is undefined', () => {
    // covers lines 22-24: the !baseUrl early-return branch
    const { result } = renderHook(() => useFaqData(undefined, 'en'));

    // All three should be set synchronously on mount (no async needed)
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    // No HTTP call should be made
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('sets data=null, loading=false, error=null when baseUrl changes from defined to undefined', async () => {
    // First render with a defined baseUrl to get an active fetch going
    mockGet.mockResolvedValueOnce({ general: [] });
    const { result, rerender } = renderHook(
      ({ url }: { url: string | undefined }) => useFaqData(url, 'en'),
      { initialProps: { url: 'http://base' as string | undefined } }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ general: [] });

    // Now change baseUrl to undefined — should reset state
    rerender({ url: undefined });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets data when primary URL succeeds (covers setData(result) on line 55)', async () => {
    // Explicit test for the happy-path assignment
    const faqPayload = { categories: [{ name: 'General', faqs: [] }] };
    mockGet.mockResolvedValueOnce(faqPayload);

    const { result } = renderHook(() => useFaqData('http://example.com/', 'fr'));

    // loading should start as true
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(faqPayload);
    expect(result.current.error).toBeNull();
    // Trailing slash is stripped by normalizedBaseUrl
    expect(mockGet).toHaveBeenCalledWith('http://example.com/faq-fr.json', expect.anything());
  });

  it('sets error when languageCode is "en" and primary fetch fails (covers lines 92-107)', async () => {
    // covers the `else` branch at lines 92-107: languageCode === 'en', primary fails → set error, no fallback
    const primaryError = new Error('English fetch failed');
    mockGet.mockRejectedValueOnce(primaryError);

    const { result } = renderHook(() => useFaqData('http://base', 'en'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Error should be set to the primary error
    expect(result.current.error).toBe(primaryError);
    expect(result.current.data).toBeNull();
    // Only one call — no fallback for 'en'
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('http://base/faq-en.json', expect.anything());
  });

  it('refetch increments counter and re-triggers the fetch', async () => {
    // First call resolves with initial data; second call resolves with updated data
    mockGet
      .mockResolvedValueOnce({ version: 1 })
      .mockResolvedValueOnce({ version: 2 });

    const { result } = renderHook(() => useFaqData('http://base', 'en'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ version: 1 });
    expect(mockGet).toHaveBeenCalledTimes(1);

    // Trigger refetch
    act(() => {
      result.current.refetch();
    });

    // loading should become true again
    await waitFor(() => expect(result.current.loading).toBe(true));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual({ version: 2 });
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('clears error before each fetch attempt (covers setError(null) on line 44)', async () => {
    // First fetch fails, second fetch (via refetch) succeeds
    const fetchError = new Error('first fetch failed');
    mockGet
      .mockRejectedValueOnce(fetchError)
      .mockResolvedValueOnce({ general: [] });

    const { result } = renderHook(() => useFaqData('http://base', 'en'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(fetchError);

    // refetch — the new fetchData call should setError(null) at the start
    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    // After successful second fetch, error should be cleared
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual({ general: [] });
  });
});
