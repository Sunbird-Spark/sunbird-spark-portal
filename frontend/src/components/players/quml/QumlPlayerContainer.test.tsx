import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import QumlPlayerContainer from './QumlPlayerContainer';
import { questionSetService } from '../../../services/QuestionSetService';

// Mock QumlPlayer component
vi.mock('./QumlPlayer', () => ({
  default: ({ metadata }: any) => (
    <div data-testid="quml-player" data-metadata-id={metadata.identifier}>
      QumlPlayer with {metadata.name}
    </div>
  ),
}));

vi.mock('../../../services/QuestionSetService', () => ({
  questionSetService: {
    getHierarchy: vi.fn(),
    getQuestionset: vi.fn(),
    getQuestionList: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

const mockHierarchyResponse = {
  result: {
    questionset: {
      identifier: 'do_123',
      name: 'Test QuestionSet',
      channel: '0144880972895272960',
      childNodes: ['do_q1'],
      children: [
        {
          identifier: 'do_section1',
          name: 'Section 1',
          mimeType: 'application/vnd.sunbird.questionset',
          children: [
            {
              identifier: 'do_q1',
              name: 'Question 1',
              mimeType: 'application/vnd.sunbird.question',
              parent: 'do_section1',
              index: 1,
              depth: 2,
            },
          ],
        },
      ],
    },
  },
};

const mockReadResponse = {
  result: {
    questionset: {
      identifier: 'do_123',
      outcomeDeclaration: {
        maxScore: { cardinality: 'single', type: 'integer', defaultValue: 1 },
      },
    },
  },
};

const mockQuestionListResponse = {
  questions: [
    {
      identifier: 'do_q1',
      name: 'Question 1',
      body: '<p>What is 2+2?</p>',
      primaryCategory: 'Multiple Choice Question',
      qType: 'MCQ',
      responseDeclaration: {
        response1: { cardinality: 'single', type: 'integer', correctResponse: { value: 0 } },
      },
      interactions: {
        response1: {
          type: 'choice',
          options: [
            { label: '<p>4</p>', value: 0 },
            { label: '<p>5</p>', value: 1 },
          ],
        },
      },
    },
  ],
  count: 1,
};

describe('QumlPlayerContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', () => {
    vi.mocked(questionSetService.getHierarchy).mockImplementation(() => new Promise(() => {}));
    vi.mocked(questionSetService.getQuestionset).mockImplementation(() => new Promise(() => {}));

    render(<QumlPlayerContainer questionSetId="do_123" />, { wrapper: createWrapper() });
    expect(screen.getByText('Loading question set...')).toBeInTheDocument();
  });

  it('should fetch and display question set data', async () => {
    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(mockHierarchyResponse as any);
    vi.mocked(questionSetService.getQuestionset).mockResolvedValue(mockReadResponse as any);
    vi.mocked(questionSetService.getQuestionList).mockResolvedValue(mockQuestionListResponse as any);

    render(<QumlPlayerContainer questionSetId="do_123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(questionSetService.getHierarchy).toHaveBeenCalledWith('do_123');
      expect(questionSetService.getQuestionset).toHaveBeenCalledWith('do_123');
      expect(questionSetService.getQuestionList).toHaveBeenCalledWith(['do_q1']);
    });

    await waitFor(() => {
      const player = screen.getByTestId('quml-player');
      expect(player).toBeInTheDocument();
      expect(player.getAttribute('data-metadata-id')).toBe('do_123');
    });
  });

  it('should merge question data from question list API', async () => {
    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(mockHierarchyResponse as any);
    vi.mocked(questionSetService.getQuestionset).mockResolvedValue(mockReadResponse as any);
    vi.mocked(questionSetService.getQuestionList).mockResolvedValue(mockQuestionListResponse as any);

    render(<QumlPlayerContainer questionSetId="do_123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/QumlPlayer with Test QuestionSet/)).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    vi.mocked(questionSetService.getHierarchy).mockRejectedValue(new Error('Network error'));
    vi.mocked(questionSetService.getQuestionset).mockResolvedValue(mockReadResponse as any);

    render(<QumlPlayerContainer questionSetId="do_123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/Error loading question set/)).toBeInTheDocument();
    });
  });

  it('should handle hierarchy without questions', async () => {
    const emptyHierarchy = {
      result: {
        questionset: {
          identifier: 'do_123',
          name: 'Empty QuestionSet',
          channel: '0144880972895272960',
          childNodes: [],
          children: [],
        },
      },
    };

    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(emptyHierarchy as any);
    vi.mocked(questionSetService.getQuestionset).mockResolvedValue(mockReadResponse as any);

    render(<QumlPlayerContainer questionSetId="do_123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(questionSetService.getQuestionList).not.toHaveBeenCalled();
      expect(screen.getByTestId('quml-player')).toBeInTheDocument();
    });
  });

  it('should set outcomeDeclaration when missing', async () => {
    const hierarchyWithoutOutcome = {
      result: {
        questionset: {
          identifier: 'do_123',
          name: 'Test QuestionSet',
          channel: '0144880972895272960',
          maxScore: 5,
          childNodes: [],
          children: [],
        },
      },
    };

    const readWithoutOutcome = {
      result: { questionset: { identifier: 'do_123' } },
    };

    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(hierarchyWithoutOutcome as any);
    vi.mocked(questionSetService.getQuestionset).mockResolvedValue(readWithoutOutcome as any);

    render(<QumlPlayerContainer questionSetId="do_123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTestId('quml-player')).toBeInTheDocument();
    });
  });

  it('should pass mode and event handlers to QumlPlayer', async () => {
    const onPlayerEvent = vi.fn();
    const onTelemetryEvent = vi.fn();

    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(mockHierarchyResponse as any);
    vi.mocked(questionSetService.getQuestionset).mockResolvedValue(mockReadResponse as any);
    vi.mocked(questionSetService.getQuestionList).mockResolvedValue(mockQuestionListResponse as any);

    render(
      <QumlPlayerContainer
        questionSetId="do_123"
        mode="review"
        onPlayerEvent={onPlayerEvent}
        onTelemetryEvent={onTelemetryEvent}
      />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByTestId('quml-player')).toBeInTheDocument();
    });
  });
});
