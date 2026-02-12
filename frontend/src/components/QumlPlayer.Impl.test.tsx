import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import QumlPlayer from './QumlPlayer';
import { questionSetService } from '../services/QuestionSetService';

vi.mock('../services/QuestionSetService', () => ({
  questionSetService: {
    getHierarchy: vi.fn(),
    getRead: vi.fn(),
    getQuestionList: vi.fn(),
  },
}));

vi.mock('../utils/buildPlayerConfig', () => ({
  buildPlayerConfig: vi.fn((params) => ({
    context: { mode: 'play', uid: params.uid, channel: params.orgChannel },
    config: {},
    metadata: params.metadata,
  })),
}));

beforeEach(() => {
  (window as any).questionListUrl = 'http://localhost:3000/action/question/v2/list';
});

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

describe('QumlPlayer - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    vi.mocked(questionSetService.getRead).mockResolvedValue(readWithoutOutcome as any);

    render(<QumlPlayer questionSetId="do_123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      const player = document.querySelector('sunbird-quml-player');
      const config = player?.getAttribute('player-config');
      if (config) {
        const parsedConfig = JSON.parse(config);
        expect(parsedConfig.metadata.outcomeDeclaration).toBeDefined();
        expect(parsedConfig.metadata.outcomeDeclaration.maxScore.defaultValue).toBe(5);
      }
    });
  });

  it('should handle question list API returning different response format', async () => {
    const altQuestionListResponse = {
      result: { questions: mockQuestionListResponse.questions, count: 1 },
    };

    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(mockHierarchyResponse as any);
    vi.mocked(questionSetService.getRead).mockResolvedValue(mockReadResponse as any);
    vi.mocked(questionSetService.getQuestionList).mockResolvedValue(altQuestionListResponse as any);

    render(<QumlPlayer questionSetId="do_123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      const player = document.querySelector('sunbird-quml-player');
      const config = player?.getAttribute('player-config');
      expect(config).toBeTruthy();
      if (config) {
        const parsedConfig = JSON.parse(config);
        const question = parsedConfig.metadata.children[0].children[0];
        expect(question.body).toBe('<p>What is 2+2?</p>');
      }
    });
  });

  it('should preserve hierarchy properties when merging questions', async () => {
    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(mockHierarchyResponse as any);
    vi.mocked(questionSetService.getRead).mockResolvedValue(mockReadResponse as any);
    vi.mocked(questionSetService.getQuestionList).mockResolvedValue(mockQuestionListResponse as any);

    render(<QumlPlayer questionSetId="do_123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      const player = document.querySelector('sunbird-quml-player');
      const config = player?.getAttribute('player-config');
      if (config) {
        const parsedConfig = JSON.parse(config);
        const question = parsedConfig.metadata.children[0].children[0];
        expect(question.parent).toBe('do_section1');
        expect(question.index).toBe(1);
        expect(question.depth).toBe(2);
      }
    });
  });
});
