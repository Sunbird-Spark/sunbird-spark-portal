import { describe, it, expect } from 'vitest';
import { pickForLearner, questionSetForLearner, ecmlForLearner, dynamicAssessForLearner } from './dynamicAssessSubset';

const ids = (n: number, prefix: string) => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

describe('pickForLearner', () => {
  it('gives the same learner the same questions every time, regardless of pool order (positive)', () => {
    const pool = ids(12, 'q');
    expect(pickForLearner(pool, 4, 'u1:c1')).toEqual(pickForLearner([...pool].reverse(), 4, 'u1:c1'));
  });

  it('gives different learners different draws (positive)', () => {
    const draws = new Set(Array.from({ length: 20 }, (_, i) => pickForLearner(ids(12, 'q'), 4, `u${i}:c1`).join(',')));
    expect(draws.size).toBeGreaterThan(1);
  });

  it('returns the whole pool when it holds no more than the count (negative)', () => {
    expect(pickForLearner(['b', 'a'], 4, 's')).toEqual(['a', 'b']);
  });
});

describe('questionSetForLearner', () => {
  const child = (id: string, level: string) => ({ identifier: id, objectType: 'Question', difficultyLevel: level, maxScore: 1 });
  const qs = {
    identifier: 'do_qs', primaryCategory: 'Dynamic QuestionSet', difficultyTarget: { E: 1, M: 2, D: 0 },
    children: [...ids(3, 'e').map((i) => child(i, 'EASY')), ...ids(6, 'm').map((i) => child(i, 'MEDIUM'))],
    maxScore: 9, outcomeDeclaration: { maxScore: { cardinality: 'single', type: 'integer', defaultValue: 9 } },
  };

  it("keeps exactly the target per level for the learner, with the score matching (positive)", () => {
    const out = questionSetForLearner(qs, 'u1');
    expect(out.children.filter((c: any) => c.difficultyLevel === 'EASY')).toHaveLength(1);
    expect(out.children.filter((c: any) => c.difficultyLevel === 'MEDIUM')).toHaveLength(2);
    expect(out.maxScore).toBe(3);
    expect(out.outcomeDeclaration.maxScore.defaultValue).toBe(3);
    expect(questionSetForLearner(qs, 'u1').children).toEqual(out.children);
  });

  it('reads a difficultyTarget stored as a JSON string', () => {
    expect(questionSetForLearner({ ...qs, difficultyTarget: '{"E":1,"M":1,"D":0}' }, 'u1').children).toHaveLength(2);
  });

  it('leaves non-Dynamic content and already-exact sets untouched (negative)', () => {
    const plain = { ...qs, primaryCategory: 'Practice Question Set' };
    expect(questionSetForLearner(plain, 'u1')).toBe(plain);
    const exact = { ...qs, difficultyTarget: { E: 3, M: 6, D: 0 } };
    expect(questionSetForLearner(exact, 'u1')).toBe(exact);
  });

  it('plays nothing, never the pool, for a missing, zero or invalid target (positive)', () => {
    expect(questionSetForLearner({ ...qs, difficultyTarget: undefined }, 'u1').children).toEqual([]);
    expect(questionSetForLearner({ ...qs, difficultyTarget: { E: 0, M: 0, D: 0 } }, 'u1').children).toEqual([]);
    expect(questionSetForLearner({ ...qs, difficultyTarget: 'nope' }, 'u1').children).toEqual([]);
  });

  it('drops non-question children such as sections instead of playing everything (positive)', () => {
    const withSection = { ...qs, children: [...qs.children, { identifier: 's1', objectType: 'QuestionSet', children: qs.children }] };
    const out = questionSetForLearner(withSection, 'u1');
    expect(out.children).toHaveLength(3);
    expect(out.children.some((c: any) => c.identifier === 's1')).toBe(false);
  });

  it('recognises questions by mimeType or a QuestionImage objectType (positive)', () => {
    const byMime = { ...qs, children: qs.children.map((c) => ({ ...c, objectType: undefined, mimeType: 'application/vnd.sunbird.question' })) };
    expect(questionSetForLearner(byMime, 'u1').children).toHaveLength(3);
    const images = { ...qs, children: qs.children.map((c) => ({ ...c, objectType: 'QuestionImage' })) };
    expect(questionSetForLearner(images, 'u1').children).toHaveLength(3);
  });

  it('scores from outcomeDeclaration and caps maxQuestions at the draw (positive)', () => {
    const scored = { ...qs, maxQuestions: 9, children: qs.children.map((c) => ({ ...c, maxScore: undefined, outcomeDeclaration: { maxScore: { defaultValue: 2 } } })) };
    const out = questionSetForLearner(scored, 'u1');
    expect(out.maxScore).toBe(6);
    expect(out.maxQuestions).toBe(3);
  });
});

describe('ecmlForLearner', () => {
  const levels: Record<string, string> = { a1: 'EASY', a2: 'EASY', a3: 'EASY', b1: 'MEDIUM', b2: 'MEDIUM', b3: 'MEDIUM' };
  const quizBody = (dynamic: boolean) => ({
    theme: { stage: [{ 'org.ekstep.questionset': [{
      config: { __cdata: JSON.stringify({ total_items: 6, max_score: 6, ...(dynamic ? { dynamic_assess: { target: { E: 1, M: 1, D: 0 }, levels } } : {}) }) },
      data: { __cdata: JSON.stringify(Object.keys(levels).map((id) => ({ identifier: id, max_score: 1 }))) },
      'org.ekstep.question': Object.keys(levels).map((id) => ({ id })),
    }] }] },
  });
  const content = (dynamic = true) => ({ identifier: 'do_ecml', primaryCategory: 'Dynamic Course Assessment', body: JSON.stringify(quizBody(dynamic)) });

  it("trims the quiz to the learner's draw per level and keeps body as a string (positive)", () => {
    const out = ecmlForLearner(content(), 'u1');
    const quiz = JSON.parse(out.body).theme.stage[0]['org.ekstep.questionset'][0];
    const kept = quiz['org.ekstep.question'].map((q: any) => q.id);
    expect(kept).toHaveLength(2);
    expect(kept.filter((id: string) => levels[id] === 'EASY')).toHaveLength(1);
    expect(JSON.parse(quiz.data.__cdata).map((i: any) => i.identifier)).toEqual(kept);
    expect(JSON.parse(quiz.config.__cdata)).toMatchObject({ total_items: 2, max_score: 2 });
    expect(ecmlForLearner(content(), 'u1').body).toBe(out.body);
  });

  it('leaves bodies without the dynamic_assess block untouched, e.g. content generated before the pool change (negative)', () => {
    const old = content(false);
    expect(ecmlForLearner(old, 'u1')).toBe(old);
  });

  it('plays nothing, never the pool, for a zero target (positive)', () => {
    const body: any = quizBody(true);
    body.theme.stage[0]['org.ekstep.questionset'][0].config.__cdata = JSON.stringify({ dynamic_assess: { target: { E: 0, M: 0, D: 0 }, levels } });
    const out: any = ecmlForLearner({ identifier: 'do_ecml', primaryCategory: 'Dynamic Course Assessment', body }, 'u1');
    expect(out.body.theme.stage[0]['org.ekstep.questionset'][0]['org.ekstep.question']).toEqual([]);
  });
});

describe('ecmlForLearner — fail closed', () => {
  it('drops the package URLs when Dynamic content has no readable body, so the renderer cannot play the pool (positive)', () => {
    const base = { identifier: 'do_e', primaryCategory: 'Dynamic Course Assessment', artifactUrl: 'https://cdn/x.ecar', streamingUrl: 'https://cdn/x' };
    for (const body of [undefined, '{not json']) {
      const out: any = ecmlForLearner({ ...base, body }, 'u1');
      expect(out.artifactUrl).toBeUndefined();
      expect(out.streamingUrl).toBeUndefined();
      expect(out.body).toBeUndefined();
    }
  });

  it('empties a quiz whose config cannot be read instead of playing it whole (positive)', () => {
    const body = { theme: { stage: [{ 'org.ekstep.questionset': [{ config: { __cdata: '{broken' }, data: { __cdata: '[{"identifier":"a1"}]' }, 'org.ekstep.question': [{ id: 'a1' }] }] }] } };
    const out: any = ecmlForLearner({ identifier: 'do_e', primaryCategory: 'Dynamic Course Assessment', body }, 'u1');
    expect(out.body.theme.stage[0]['org.ekstep.questionset'][0]['org.ekstep.question']).toEqual([]);
  });

  it('leaves non-Dynamic content without a body untouched (negative)', () => {
    const plain = { identifier: 'do_p', primaryCategory: 'Learning Resource', artifactUrl: 'https://cdn/p' };
    expect(ecmlForLearner(plain, 'u1')).toBe(plain);
  });
});

describe('draw golden vector (identical in generic-editor-v2 and the QuestionSet editor)', () => {
  it('picks the same ids for a fixed seed in every copy', () => {
    expect(pickForLearner(['q1', 'q2', 'q3', 'q4', 'q5', 'q6'], 2, 'user-1:do_123:EASY')).toEqual(['q6', 'q3']);
  });
});

describe('dynamicAssessForLearner', () => {
  it('passes other content through and falls back to a shared seed for anonymous learners', () => {
    const video = { identifier: 'do_v', primaryCategory: 'Learning Resource' };
    expect(dynamicAssessForLearner(video, null)).toBe(video);
    expect(dynamicAssessForLearner(undefined, 'u1')).toBeUndefined();
  });
});
