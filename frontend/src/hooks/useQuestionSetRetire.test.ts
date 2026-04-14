import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQuestionSetRetire } from './useQuestionSetRetire';
import { questionSetService } from '../services/QuestionSetService';

// Mock the service
vi.mock('../services/QuestionSetService', () => ({
  questionSetService: {
    retireQuestionSet: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
  
  return Wrapper;
};

describe('useQuestionSetRetire', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call questionSetService.retireQuestionSet with correct parameters', async () => {
    const mockRetireResponse = {
      result: {
        identifier: 'do_qs_123',
        status: 'Retired'
      }
    };
    
    vi.mocked(questionSetService.retireQuestionSet).mockResolvedValue(mockRetireResponse);

    const { result } = renderHook(() => useQuestionSetRetire(), {
      wrapper: createWrapper(),
    });

    const questionSetId = 'do_qs_123';
    result.current.mutate(questionSetId);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(questionSetService.retireQuestionSet).toHaveBeenCalledWith(questionSetId);
    expect(result.current.data).toEqual(mockRetireResponse);
  });

  it('should handle errors correctly', async () => {
    const mockError = new Error('Retire failed');
    vi.mocked(questionSetService.retireQuestionSet).mockRejectedValue(mockError);

    const { result } = renderHook(() => useQuestionSetRetire(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('do_qs_123');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });

  it('should have correct initial state', () => {
    const { result } = renderHook(() => useQuestionSetRetire(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isIdle).toBe(true);
    expect(result.current.isPending).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });
});