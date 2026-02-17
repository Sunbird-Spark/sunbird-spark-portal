import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFormRead } from './useForm';
import { FormService } from '../services/FormService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock FormService
vi.mock('../services/FormService', () => {
  return {
    FormService: function() {
      return {
        formRead: () => Promise.resolve({ data: { result: { form: { id: '123' } } } }),
      };
    },
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => React.createElement(QueryClientProvider, { client: queryClient }, children);

describe('useFormRead', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('should call formRead when hook is used', async () => {
    const request = {
      type: 'content',
      subType: 'resource',
      action: 'create',
    };

    const { result } = renderHook(() => useFormRead({ request }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data.result.form.id).toBe('123');
  });
});
