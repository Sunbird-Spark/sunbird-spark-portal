import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('QumlPlayer - Basic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    vi.mocked(questionSetService.getHierarchy).mockImplementation(() => new Promise(() => {}));
    vi.mocked(questionSetService.getRead).mockImplementation(() => new Promise(() => {}));

    render(<QumlPlayer questionSetId="do_123" />, { wrapper: createWrapper() });
    expect(screen.queryByText('No question set data available')).toBeInTheDocument();
  });

  it('should fetch and display question set data', async () => {
    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(mockHierarchyResponse as any);
    vi.mocked(questionSetService.getRead).mockResolvedValue(mockReadResponse as any);
    vi.mocked(questionSetService.getQuestionList).mockResolvedValue(mockQuestionListResponse as any);

    render(<QumlPlayer questionSetId="do_123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(questionSetService.getHierarchy).toHaveBeenCalledWith('do_123');
      expect(questionSetService.getRead).toHaveBeenCalledWith('do_123');
      expect(questionSetService.getQuestionList).toHaveBeenCalledWith(['do_q1']);
    });

    await waitFor(() => {
      expect(document.querySelector('sunbird-quml-player')).toBeInTheDocument();
    });
  });

  it('should merge question data from question list API', async () => {
    vi.mocked(questionSetService.getHierarchy).mockResolvedValue(mockHierarchyResponse as any);
    vi.mocked(questionSetService.getRead).mockResolvedValue(mockReadResponse as any);
    vi.mocked(questionSetService.getQuestionList).mockResolvedValue(mockQuestionListResponse as any);

    render(<QumlPlayer questionSetId="do_123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      const player = document.querySelector('sunbird-quml-player');
      const config = player?.getAttribute('player-config');
      expect(config).toBeTruthy();
      if (config) {
        const parsedConfig = JSON.parse(config);
        const question = parsedConfig.metadata.children[0].children[0];
        expect(question.body).toBe('<p>What is 2+2?</p>');
        expect(question.primaryCategory).toBe('Multiple Choice Question');
      }
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
    vi.mocked(questionSetService.getRead).mockResolvedValue(mockReadResponse as any);

    render(<QumlPlayer questionSetId="do_123" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(questionSetService.getQuestionList).not.toHaveBeenCalled();
      expect(document.querySelector('sunbird-quml-player')).toBeInTheDocument();
    });
  });
});