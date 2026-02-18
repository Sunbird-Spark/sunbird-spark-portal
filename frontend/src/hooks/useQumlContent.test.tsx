import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { useQumlContent } from './useQumlContent';
import { questionSetService } from '../services/QuestionSetService';
import type { ReactNode } from 'react';

// Mock the QuestionSetService
vi.mock('../services/QuestionSetService', () => ({
  questionSetService: {
    getHierarchy: vi.fn(),
    getQuestionList: vi.fn(),
  },
}));

describe('useQumlContent', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    const Wrapper = ({ children }: { children: ReactNode }) => {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    };
    return Wrapper;
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch and process QUML content successfully', async () => {
    const mockHierarchy = {
      questionset: {
        identifier: 'qs1',
        name: 'Test Question Set',
        mimeType: 'application/vnd.sunbird.questionset',
        maxScore: 10,
        children: [
          {
            identifier: 'q1',
            mimeType: 'application/vnd.sunbird.question',
            name: 'Question 1',
          },
          {
            identifier: 'q2',
            mimeType: 'application/vnd.sunbird.question',
            name: 'Question 2',
          },
        ],
      },
    };

    const mockQuestions = {
      result: {
        questions: [
          {
            identifier: 'q1',
            name: 'Question 1',
            body: '<p>What is 2+2?</p>',
            responseDeclaration: {},
            interactions: {},
          },
          {
            identifier: 'q2',
            name: 'Question 2',
            body: '<p>What is 3+3?</p>',
            responseDeclaration: {},
            interactions: {},
          },
        ],
      },
    };

    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(mockHierarchy);
    vi.mocked(questionSetService.getQuestionList).mockResolvedValue(mockQuestions);

    const { result } = renderHook(() => useQumlContent('qs1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data.identifier).toBe('qs1');
    expect(result.current.data.children).toHaveLength(2);
    expect(result.current.data.children[0].body).toBe('<p>What is 2+2?</p>');
    expect(result.current.data.outcomeDeclaration.maxScore).toBeDefined();
  });

  it('should handle nested questions in hierarchy', async () => {
    const mockHierarchy = {
      questionset: {
        identifier: 'qs1',
        name: 'Test Question Set',
        children: [
          {
            identifier: 'section1',
            mimeType: 'application/vnd.sunbird.questionset',
            children: [
              {
                identifier: 'q1',
                mimeType: 'application/vnd.sunbird.question',
              },
            ],
          },
        ],
      },
    };

    const mockQuestions = {
      result: {
        questions: [
          {
            identifier: 'q1',
            body: '<p>Nested question</p>',
            responseDeclaration: {},
          },
        ],
      },
    };

    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(mockHierarchy);
    vi.mocked(questionSetService.getQuestionList).mockResolvedValue(mockQuestions);

    const { result } = renderHook(() => useQumlContent('qs1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data.children[0].children[0].body).toBe('<p>Nested question</p>');
  });

  it('should throw error when hierarchy is missing questionset', async () => {
    const mockHierarchy = {
      someOtherKey: {},
    };

    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(mockHierarchy);

    const { result } = renderHook(() => useQumlContent('qs1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toContain('Hierarchy payload missing questionset');
  });

  it('should handle empty question list', async () => {
    const mockHierarchy = {
      questionset: {
        identifier: 'qs1',
        name: 'Empty Question Set',
        children: [],
      },
    };

    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(mockHierarchy);

    const { result } = renderHook(() => useQumlContent('qs1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data.children).toHaveLength(0);
    expect(questionSetService.getQuestionList).not.toHaveBeenCalled();
  });

  it('should create outcomeDeclaration.maxScore if missing', async () => {
    const mockHierarchy = {
      questionset: {
        identifier: 'qs1',
        maxScore: 5,
        children: [],
      },
    };

    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(mockHierarchy);

    const { result } = renderHook(() => useQumlContent('qs1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data.outcomeDeclaration.maxScore).toEqual({
      cardinality: 'single',
      type: 'integer',
      defaultValue: 5,
    });
  });

  it('should preserve existing outcomeDeclaration.maxScore', async () => {
    const mockHierarchy = {
      questionset: {
        identifier: 'qs1',
        outcomeDeclaration: {
          maxScore: {
            cardinality: 'multiple',
            type: 'float',
            defaultValue: 15,
          },
        },
        children: [],
      },
    };

    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(mockHierarchy);

    const { result } = renderHook(() => useQumlContent('qs1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data.outcomeDeclaration.maxScore).toEqual({
      cardinality: 'multiple',
      type: 'float',
      defaultValue: 15,
    });
  });

  it('should use default maxScore of 1 when not provided', async () => {
    const mockHierarchy = {
      questionset: {
        identifier: 'qs1',
        children: [],
      },
    };

    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(mockHierarchy);

    const { result } = renderHook(() => useQumlContent('qs1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data.outcomeDeclaration.maxScore.defaultValue).toBe(1);
  });

  it('should handle questions response with alternative structure', async () => {
    const mockHierarchy = {
      questionset: {
        identifier: 'qs1',
        children: [
          {
            identifier: 'q1',
            mimeType: 'application/vnd.sunbird.question',
          },
        ],
      },
    };

    const mockQuestions = {
      questions: [
        {
          identifier: 'q1',
          body: '<p>Question with alternative structure</p>',
        },
      ],
    };

    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(mockHierarchy);
    vi.mocked(questionSetService.getQuestionList).mockResolvedValue(mockQuestions);

    const { result } = renderHook(() => useQumlContent('qs1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data.children[0].body).toBe('<p>Question with alternative structure</p>');
  });

  it('should keep original question stub if full data not found', async () => {
    const mockHierarchy = {
      questionset: {
        identifier: 'qs1',
        children: [
          {
            identifier: 'q1',
            mimeType: 'application/vnd.sunbird.question',
            name: 'Original Question',
          },
        ],
      },
    };

    const mockQuestions = {
      result: {
        questions: [],
      },
    };

    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(mockHierarchy);
    vi.mocked(questionSetService.getQuestionList).mockResolvedValue(mockQuestions);

    const { result } = renderHook(() => useQumlContent('qs1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data.children[0].name).toBe('Original Question');
    expect(result.current.data.children[0].body).toBeUndefined();
  });

  it('should not fetch when enabled is false', async () => {
    const { result } = renderHook(() => useQumlContent('qs1', { enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe('idle');
    expect(questionSetService.getHierarchy).not.toHaveBeenCalled();
  });

  it('should not fetch when questionSetId is empty', async () => {
    const { result } = renderHook(() => useQumlContent(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe('idle');
    expect(questionSetService.getHierarchy).not.toHaveBeenCalled();
  });

  it('should handle questions without identifier gracefully', async () => {
    const mockHierarchy = {
      questionset: {
        identifier: 'qs1',
        children: [
          {
            identifier: 'q1',
            mimeType: 'application/vnd.sunbird.question',
          },
        ],
      },
    };

    const mockQuestions = {
      result: {
        questions: [
          {
            body: '<p>Question without identifier</p>',
          },
          {
            identifier: 'q1',
            body: '<p>Valid question</p>',
          },
        ],
      },
    };

    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(mockHierarchy);
    vi.mocked(questionSetService.getQuestionList).mockResolvedValue(mockQuestions);

    const { result } = renderHook(() => useQumlContent('qs1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data.children[0].body).toBe('<p>Valid question</p>');
  });

  it('should handle null or undefined nodes in hierarchy', async () => {
    const mockHierarchy = {
      questionset: {
        identifier: 'qs1',
        children: [
          null,
          {
            identifier: 'q1',
            mimeType: 'application/vnd.sunbird.question',
          },
          undefined,
        ],
      },
    };

    const mockQuestions = {
      result: {
        questions: [
          {
            identifier: 'q1',
            body: '<p>Valid question</p>',
          },
        ],
      },
    };

    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(mockHierarchy);
    vi.mocked(questionSetService.getQuestionList).mockResolvedValue(mockQuestions);

    const { result } = renderHook(() => useQumlContent('qs1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
  });
});
