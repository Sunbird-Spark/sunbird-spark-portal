import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQumlContent } from './useQumlContent';
import { questionSetService } from '../services/QuestionSetService';
import type { ReactNode } from 'react';

vi.mock('../services/QuestionSetService', () => ({
  questionSetService: {
    getHierarchy: vi.fn(),
    getQuestionList: vi.fn(),
  },
}));

/**
 * Scoring-critical normalisation the QuML player depends on: the max score it
 * multiplies each answer by, and the response type it needs in order to compare
 * a correct answer against the selected option at all. Split out of
 * useQumlContent.test.tsx to stay under the 500-line test file cap.
 */
describe('useQumlContent scoring normalisation', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return Wrapper;
  };

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  // Regression: the player's answer handler multiplies the scored fraction by the
  // TOP-LEVEL `node.maxScore ?? 1` and reports that as `edata.item.maxscore`.
  // `question/v2/list` only ever returns the max inside `outcomeDeclaration`, so
  // without mirroring it every question scored out of 1 and an assessment's best
  // score came back as `0/<questionCount>`.
  describe('question maxScore mirroring', () => {
    const hierarchyWithOneQuestion = {
      questionset: {
        identifier: 'qs1',
        maxScore: 10,
        children: [
          { identifier: 'q1', mimeType: 'application/vnd.sunbird.question' },
        ],
      },
    };

    async function renderWithQuestion(question: Record<string, unknown>) {
      vi.mocked(questionSetService.getHierarchy).mockResolvedValue(
        JSON.parse(JSON.stringify(hierarchyWithOneQuestion))
      );
      vi.mocked(questionSetService.getQuestionList).mockResolvedValue({
        result: { questions: [question] },
      });
      const { result } = renderHook(() => useQumlContent('qs1'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      return result.current.data.children[0];
    }

    it('mirrors outcomeDeclaration.maxScore.defaultValue onto the top-level maxScore', async () => {
      const q = await renderWithQuestion({
        identifier: 'q1',
        outcomeDeclaration: { maxScore: { cardinality: 'single', type: 'integer', defaultValue: 5 } },
      });
      expect(q.maxScore).toBe(5);
      expect(q.outcomeDeclaration.maxScore.defaultValue).toBe(5);
    });

    it('keeps a top-level maxScore and backfills outcomeDeclaration from it', async () => {
      const q = await renderWithQuestion({ identifier: 'q1', maxScore: 5 });
      expect(q.maxScore).toBe(5);
      expect(q.outcomeDeclaration.maxScore.defaultValue).toBe(5);
    });

    it('defaults both to 1 when the question declares neither', async () => {
      const q = await renderWithQuestion({ identifier: 'q1' });
      expect(q.maxScore).toBe(1);
      expect(q.outcomeDeclaration.maxScore.defaultValue).toBe(1);
    });

    // Precedence deliberately matches the player's own resolver (top-level first),
    // so mirroring can only fill in a missing value, never change the one the
    // player would already have used.
    it('prefers the top-level maxScore over a conflicting outcomeDeclaration', async () => {
      const q = await renderWithQuestion({
        identifier: 'q1',
        maxScore: 2,
        outcomeDeclaration: { maxScore: { cardinality: 'single', type: 'integer', defaultValue: 7 } },
      });
      expect(q.maxScore).toBe(2);
      expect(q.outcomeDeclaration.maxScore.defaultValue).toBe(2);
    });

    it('mirrors the max onto the questionset root too', async () => {
      vi.mocked(questionSetService.getHierarchy).mockResolvedValue({
        questionset: { identifier: 'qs1', maxScore: 10, children: [] },
      });
      const { result } = renderHook(() => useQumlContent('qs1'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data.maxScore).toBe(10);
      expect(result.current.data.outcomeDeclaration.maxScore.defaultValue).toBe(10);
    });
  });

  // Regression: the player scores multiple-choice answers with a strict `===`
  // between correctResponse.value and the selected option's value, coercing the
  // former to a number only when the declaration says `type: 'integer'`. Content
  // that stores "0" against numeric options therefore scored every answer 0.
  describe('response declaration type alignment', () => {
    async function renderQuestion(question: Record<string, unknown>) {
      vi.mocked(questionSetService.getHierarchy).mockResolvedValue({
        questionset: {
          identifier: 'qs1',
          children: [{ identifier: 'q1', mimeType: 'application/vnd.sunbird.question' }],
        },
      });
      vi.mocked(questionSetService.getQuestionList).mockResolvedValue({
        result: { questions: [question] },
      });
      const { result } = renderHook(() => useQumlContent('qs1'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      return result.current.data.children[0];
    }

    const numericOptions = {
      response1: { options: [{ value: 0, label: 'A' }, { value: 1, label: 'B' }] },
    };

    it('declares integer when the options are numeric but the type is missing', async () => {
      const q = await renderQuestion({
        identifier: 'q1',
        interactions: numericOptions,
        responseDeclaration: { response1: { cardinality: 'single', correctResponse: { value: '0' } } },
      });
      expect(q.responseDeclaration.response1.type).toBe('integer');
    });

    it('declares integer when the type contradicts numeric options', async () => {
      const q = await renderQuestion({
        identifier: 'q1',
        interactions: numericOptions,
        responseDeclaration: { response1: { type: 'string', correctResponse: { value: '1' } } },
      });
      expect(q.responseDeclaration.response1.type).toBe('integer');
    });

    it('leaves a genuinely string-valued interaction alone', async () => {
      const q = await renderQuestion({
        identifier: 'q1',
        interactions: { response1: { options: [{ value: 'a' }, { value: 'b' }] } },
        responseDeclaration: { response1: { type: 'string', correctResponse: { value: 'a' } } },
      });
      expect(q.responseDeclaration.response1.type).toBe('string');
    });

    it('leaves an already-integer declaration untouched', async () => {
      const q = await renderQuestion({
        identifier: 'q1',
        interactions: numericOptions,
        responseDeclaration: { response1: { type: 'integer', correctResponse: { value: '0' } } },
      });
      expect(q.responseDeclaration.response1.type).toBe('integer');
    });

    it('does not invent a type when the question declares no interactions', async () => {
      const q = await renderQuestion({
        identifier: 'q1',
        responseDeclaration: { response1: { correctResponse: { value: '0' } } },
      });
      expect(q.responseDeclaration.response1.type).toBeUndefined();
    });

    // Match-the-following stores options as {left,right}, not an array.
    it('ignores non-array option shapes', async () => {
      const q = await renderQuestion({
        identifier: 'q1',
        interactions: { response1: { options: { left: [{ value: 1 }], right: [{ value: 2 }] } } },
        responseDeclaration: { response1: { correctResponse: { value: { 1: 2 } } } },
      });
      expect(q.responseDeclaration.response1.type).toBeUndefined();
    });

    it('handles a question with no responseDeclaration at all', async () => {
      const q = await renderQuestion({ identifier: 'q1', interactions: numericOptions });
      expect(q.responseDeclaration).toBeUndefined();
    });
  });
});
