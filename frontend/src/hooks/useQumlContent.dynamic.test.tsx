import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { useQumlContent } from './useQumlContent';
import { questionSetService } from '../services/QuestionSetService';
import type { ReactNode } from 'react';

vi.mock('../services/QuestionSetService', () => ({
  questionSetService: {
    getHierarchy: vi.fn(),
    getQuestionList: vi.fn(),
  },
}));

// A real learner id, so the draws below are pinned to this learner rather than the shared anonymous seed.
vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({
  default: { getUserId: () => 'learner-1' },
}));

const question = (identifier: string, difficultyLevel?: string) => ({
  identifier, objectType: 'Question', mimeType: 'application/vnd.sunbird.question', ...(difficultyLevel ? { difficultyLevel } : {}),
});
const level = (l: string, n: number) => Array.from({ length: n }, (_, i) => question(`${l[0]}${i}`, l));

describe('useQumlContent — Dynamic Assess and question/list batching', () => {
  let queryClient: QueryClient;
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  const listedIds = () => (questionSetService.getQuestionList as Mock).mock.calls.flatMap((c) => c[0] as string[]);

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("fetches only this learner's drawn questions for a Dynamic QuestionSet (positive)", async () => {
    // Target 2/2/2 from a pool of 10 per level; the ids are learner-1's draw for do_dqs.
    (questionSetService.getHierarchy as Mock).mockResolvedValue({
      questionset: {
        identifier: 'do_dqs', primaryCategory: 'Dynamic QuestionSet', difficultyTarget: '{"E":2,"M":2,"D":2}',
        children: [...level('EASY', 10), ...level('MEDIUM', 10), ...level('DIFFICULT', 10)],
      },
    });
    (questionSetService.getQuestionList as Mock).mockResolvedValue({ questions: [] });
    const { result } = renderHook(() => useQumlContent('do_dqs'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect([...listedIds()].sort()).toEqual(['D1', 'D5', 'E3', 'E4', 'M6', 'M7']);
    expect(result.current.data.children).toHaveLength(6);
  });

  it('still fetches every question for an ordinary QuestionSet (negative)', async () => {
    const children = Array.from({ length: 8 }, (_, i) => question(`q${i}`));
    (questionSetService.getHierarchy as Mock).mockResolvedValue({ questionset: { identifier: 'qs1', primaryCategory: 'Practice Question Set', children } });
    (questionSetService.getQuestionList as Mock).mockResolvedValue({ questions: [] });
    const { result } = renderHook(() => useQumlContent('qs1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect((questionSetService.getQuestionList as Mock).mock.calls).toHaveLength(1);
    expect(listedIds()).toHaveLength(8);
  });

  it('fetches an ordinary QuestionSet larger than 20 in batches of 20, since question/list rejects more (positive)', async () => {
    const children = Array.from({ length: 25 }, (_, i) => question(`q${i}`));
    (questionSetService.getHierarchy as Mock).mockResolvedValue({ questionset: { identifier: 'qs_big', primaryCategory: 'Practice Question Set', children } });
    (questionSetService.getQuestionList as Mock).mockImplementation(async (ids: string[]) => ({ questions: ids.map((identifier) => ({ identifier, body: 'b' })) }));
    const { result } = renderHook(() => useQumlContent('qs_big'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect((questionSetService.getQuestionList as Mock).mock.calls.map((c) => (c[0] as string[]).length)).toEqual([20, 5]);
    expect(result.current.data.children.map((c: any) => c.identifier)).toEqual(children.map((c) => c.identifier));
    expect(result.current.data.children.every((c: any) => c.body === 'b')).toBe(true);
  });

  it('fetches a Dynamic learner set larger than 20 in batches of 20, and plays all of it (positive)', async () => {
    // Target 15/15/10 = 40 per learner, from a pool of 120.
    (questionSetService.getHierarchy as Mock).mockResolvedValue({
      questionset: {
        identifier: 'do_big', primaryCategory: 'Dynamic QuestionSet', difficultyTarget: { E: 15, M: 15, D: 10 },
        children: [...level('EASY', 45), ...level('MEDIUM', 45), ...level('DIFFICULT', 30)],
      },
    });
    (questionSetService.getQuestionList as Mock).mockImplementation(async (ids: string[]) => ({ questions: ids.map((identifier) => ({ identifier, body: 'b' })) }));
    const { result } = renderHook(() => useQumlContent('do_big'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect((questionSetService.getQuestionList as Mock).mock.calls.map((c) => (c[0] as string[]).length)).toEqual([20, 20]);
    expect(result.current.data.children).toHaveLength(40);
    expect(result.current.data.children.every((c: any) => c.body === 'b')).toBe(true);
  });

  it("totals a Dynamic set's score from the hydrated questions, not the score-less hierarchy stubs (positive)", async () => {
    // Stubs carry no marks; question/list returns 5 marks each, so the drawn 2 questions are worth 10.
    (questionSetService.getHierarchy as Mock).mockResolvedValue({
      questionset: {
        identifier: 'do_marks', primaryCategory: 'Dynamic QuestionSet', difficultyTarget: '{"E":2,"M":0,"D":0}',
        children: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'].map((id) => question(id, 'EASY')),
      },
    });
    (questionSetService.getQuestionList as Mock).mockImplementation(async (ids: string[]) => ({
      questions: ids.map((identifier) => ({ identifier, mimeType: 'application/vnd.sunbird.question', maxScore: 5 })),
    }));
    const { result } = renderHook(() => useQumlContent('do_marks'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.children).toHaveLength(2);
    expect(result.current.data.maxScore).toBe(10);
    expect(result.current.data.outcomeDeclaration.maxScore.defaultValue).toBe(10);
  });

  it("keeps an ordinary QuestionSet's published score untouched (negative)", async () => {
    (questionSetService.getHierarchy as Mock).mockResolvedValue({
      questionset: { identifier: 'qs_marks', primaryCategory: 'Practice Question Set', maxScore: 3, children: [question('q1')] },
    });
    (questionSetService.getQuestionList as Mock).mockResolvedValue({ questions: [{ identifier: 'q1', mimeType: 'application/vnd.sunbird.question', maxScore: 5 }] });
    const { result } = renderHook(() => useQumlContent('qs_marks'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.maxScore).toBe(3);
    expect(result.current.data.outcomeDeclaration.maxScore.defaultValue).toBe(3);
  });
});
