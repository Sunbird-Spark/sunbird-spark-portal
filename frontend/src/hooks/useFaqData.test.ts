import { renderHook, waitFor } from '@testing-library/react';
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
    expect(mockGet).toHaveBeenCalledWith('http://base/faq-es.json');
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('falls back to English if primary language fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('Primary failed')); // Primary 'es' fails
    mockGet.mockResolvedValueOnce({ general: ['fallback'] });   // Fallback 'en' succeeds

    const { result } = renderHook(() => useFaqData('http://base', 'es'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual({ general: ['fallback'] });
    expect(mockGet).toHaveBeenCalledWith('http://base/faq-es.json');
    expect(mockGet).toHaveBeenCalledWith('http://base/faq-en.json');
  });

  it('fails if both primary and fallback fail', async () => {
    mockGet.mockRejectedValueOnce(new Error('Primary failed'));
    mockGet.mockRejectedValueOnce(new Error('Fallback failed'));

    const { result } = renderHook(() => useFaqData('http://base', 'es'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeTruthy();
    expect(mockGet).toHaveBeenCalledWith('http://base/faq-es.json');
    expect(mockGet).toHaveBeenCalledWith('http://base/faq-en.json');
  });

  it('does not fallback if primary is already English', async () => {
    mockGet.mockRejectedValueOnce(new Error('English failed'));

    const { result } = renderHook(() => useFaqData('http://base', 'en'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeTruthy();
    expect(mockGet).toHaveBeenCalledWith('http://base/faq-en.json');
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
