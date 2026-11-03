import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useLearnerPlayerMetadata } from './useLearnerPlayerMetadata';

vi.mock('@/hooks/useAppI18n', () => ({ useAppI18n: () => ({ t: (key: string) => key }) }));
vi.mock('@/services/userAuthInfoService/userAuthInfoService', () => ({ default: { getUserId: () => 'learner-1' } }));

const levels: Record<string, string> = { a1: 'EASY', a2: 'EASY', b1: 'MEDIUM', b2: 'MEDIUM' };
const body = JSON.stringify({
  theme: { stage: [{ 'org.ekstep.questionset': [{
    config: { __cdata: JSON.stringify({ dynamic_assess: { target: { E: 1, M: 0, D: 0 }, levels } }) },
    data: { __cdata: JSON.stringify(Object.keys(levels).map((identifier) => ({ identifier }))) },
    'org.ekstep.question': Object.keys(levels).map((id) => ({ id })),
  }] }] },
});
const ecml = (over: Record<string, unknown> = {}) => ({ identifier: 'do_e', primaryCategory: 'Dynamic Course Assessment', body, ...over });
const questionsOf = (m: any) => JSON.parse(m.body).theme.stage[0]['org.ekstep.questionset'][0]['org.ekstep.question'];

describe('useLearnerPlayerMetadata', () => {
  it("plays the learner's draw of a Dynamic ECML pool (positive)", () => {
    const { result } = renderHook(() => useLearnerPlayerMetadata(ecml(), undefined, false));
    expect(questionsOf(result.current.playerMetadata)).toHaveLength(1);
    expect(result.current.notReadyError).toBeNull();
  });

  it('reports a translated not-ready error for Dynamic ECML without a body (positive)', () => {
    const { result } = renderHook(() => useLearnerPlayerMetadata(ecml({ body: undefined }), undefined, false));
    expect(result.current.notReadyError?.message).toBe('content.dynamicAssessNotReady');
  });

  it('reports the not-ready error for a Dynamic QuestionSet whose draw is empty (positive)', () => {
    const emptyDraw = { identifier: 'do_q', primaryCategory: 'Dynamic QuestionSet', children: [], dynamicAssessUnavailable: true };
    const { result } = renderHook(() => useLearnerPlayerMetadata(undefined, emptyDraw, true));
    expect(result.current.notReadyError?.message).toBe('content.dynamicAssessNotReady');
  });

  it('passes QuML data and other content through without an error (negative)', () => {
    const quml = { identifier: 'do_q' };
    expect(renderHook(() => useLearnerPlayerMetadata(ecml(), quml, true)).result.current.playerMetadata).toBe(quml);
    const video = { identifier: 'do_v', primaryCategory: 'Learning Resource' };
    const { result } = renderHook(() => useLearnerPlayerMetadata(video, undefined, false));
    expect(result.current.playerMetadata).toBe(video);
    expect(result.current.notReadyError).toBeNull();
  });
});
