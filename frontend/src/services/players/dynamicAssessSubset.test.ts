import { describe, it, expect } from 'vitest';
import {
  pickForLearner, questionSetForLearner, ecmlForLearner, dynamicAssessForLearner, poolMultiplier, isDynamicAssessUnavailable, dynamicAssessFullPool,
} from './dynamicAssessSubset';

describe('dynamicAssessFullPool', () => {
  const question = (identifier: string, difficultyLevel: string) => ({ identifier, objectType: 'Question', difficultyLevel });
  const pool = { identifier: 'do_qs', primaryCategory: 'Dynamic QuestionSet', difficultyTarget: { E: 1, M: 0, D: 0 }, children: [question('e0', 'EASY'), question('e1', 'EASY'), question('m0', 'MEDIUM')] };

  it('returns a generated Dynamic QuestionSet or ECML unchanged, every question included (positive)', () => {
    expect(dynamicAssessFullPool(pool)).toBe(pool);
    const ecml = { identifier: 'do_e', primaryCategory: 'Dynamic Course Assessment', body: '{"theme":{"stage":[]}}' };
    expect(dynamicAssessFullPool(ecml)).toBe(ecml);
  });

  it('marks Dynamic content with nothing generated unavailable (positive)', () => {
    expect(isDynamicAssessUnavailable(dynamicAssessFullPool({ ...pool, children: [] }))).toBe(true);
    for (const body of [undefined, '', '{broken']) {
      expect(isDynamicAssessUnavailable(dynamicAssessFullPool({ identifier: 'do_e', primaryCategory: 'Dynamic Course Assessment', body }))).toBe(true);
    }
  });

  it('leaves non-Dynamic content untouched (negative)', () => {
    const plain = { identifier: 'do_p', primaryCategory: 'Practice Question Set', children: [] };
    expect(dynamicAssessFullPool(plain)).toBe(plain);
    expect(dynamicAssessFullPool(undefined)).toBeUndefined();
  });
});

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
    // Literal ids for seed u1:do_qs (pool 3 EASY + 6 MEDIUM, target 1/2, multiplier 2), so a drifted draw fails here.
    expect(out.children.map((c: any) => c.identifier)).toEqual(['e0', 'm3', 'm5']);
    expect(out.maxScore).toBe(3);
    expect(out.outcomeDeclaration.maxScore.defaultValue).toBe(3);
    expect(questionSetForLearner(qs, 'u1').children).toEqual(out.children);
  });

  it('reads a difficultyTarget stored as a JSON string', () => {
    expect(questionSetForLearner({ ...qs, difficultyTarget: '{"E":1,"M":1,"D":0}' }, 'u1').children).toHaveLength(2);
  });

  it('caps a level at what its pool supports, never returning an undersized pool whole (positive)', () => {
    // Target 3/6 needs 6 EASY + 12 MEDIUM at multiplier 2; the pool holds 3 + 6, so the learner gets floor(3/2)=1 + floor(6/2)=3.
    const out = questionSetForLearner({ ...qs, difficultyTarget: { E: 3, M: 6, D: 0 } }, 'u1');
    expect(out.children.map((c: any) => c.identifier)).toEqual(['e0', 'm1', 'm3', 'm5']);
    expect(out.children.length).toBeLessThan(qs.children.length);
  });

  it("reads the set's own multiplier, falling back to 2 for missing or unusable values (positive/negative)", () => {
    const medium3 = { ...qs, difficultyTarget: { E: 0, M: 3, D: 0 } };
    expect(questionSetForLearner(medium3, 'u1').children).toHaveLength(3);
    expect(questionSetForLearner({ ...medium3, multiplier: 3 }, 'u1').children).toHaveLength(2);
    expect(questionSetForLearner({ ...medium3, multiplier: '0' }, 'u1').children).toHaveLength(3);
  });

  it('leaves non-Dynamic content untouched (negative)', () => {
    const plain = { ...qs, primaryCategory: 'Practice Question Set' };
    expect(questionSetForLearner(plain, 'u1')).toBe(plain);
  });

  it('plays nothing, never the pool, for a missing, zero or invalid target (positive)', () => {
    expect(questionSetForLearner({ ...qs, difficultyTarget: undefined }, 'u1').children).toEqual([]);
    expect(questionSetForLearner({ ...qs, difficultyTarget: { E: 0, M: 0, D: 0 } }, 'u1').children).toEqual([]);
    expect(questionSetForLearner({ ...qs, difficultyTarget: 'nope' }, 'u1').children).toEqual([]);
  });

  it('marks an empty draw unavailable, so the player never re-fetches the pool itself (positive)', () => {
    // Target 1/1/1 from a pool of one per level: each level supports floor(1/2)=0, so the learner draws nothing.
    const onePerLevel = { ...qs, difficultyTarget: { E: 1, M: 1, D: 1 }, children: [child('e0', 'EASY'), child('m0', 'MEDIUM'), child('d0', 'DIFFICULT')] };
    const out: any = questionSetForLearner(onePerLevel, 'u1');
    expect(out.children).toEqual([]);
    expect(out.childNodes).toEqual([]);
    expect(isDynamicAssessUnavailable(out)).toBe(true);
    expect(isDynamicAssessUnavailable(questionSetForLearner({ ...qs, difficultyTarget: { E: 0, M: 0, D: 0 } }, 'u1'))).toBe(true);
    expect(isDynamicAssessUnavailable(questionSetForLearner({ ...qs, children: [] }, 'u1'))).toBe(true);
  });

  it('does not mark a non-empty draw or a non-Dynamic set unavailable (negative)', () => {
    expect(isDynamicAssessUnavailable(questionSetForLearner(qs, 'u1'))).toBe(false);
    expect(isDynamicAssessUnavailable(questionSetForLearner({ ...qs, primaryCategory: 'Practice Question Set', children: [] }, 'u1'))).toBe(false);
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

describe('poolMultiplier', () => {
  it('reads an integer >= 1 as a number or numeric string (positive)', () => {
    expect(poolMultiplier({ multiplier: 3 })).toBe(3);
    expect(poolMultiplier({ multiplier: '4' })).toBe(4);
    expect(poolMultiplier({ multiplier: 2.9 })).toBe(2);
  });

  it('defaults to 2 when missing, below 1 or not a number (negative)', () => {
    for (const multiplier of [undefined, 0, -1, '', 'abc', null]) expect(poolMultiplier({ multiplier })).toBe(2);
    expect(poolMultiplier(undefined)).toBe(2);
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

  it('caps an undersized quiz pool, so a raised target never plays it whole (positive)', () => {
    const body: any = quizBody(true);
    body.theme.stage[0]['org.ekstep.questionset'][0].config.__cdata = JSON.stringify({ dynamic_assess: { target: { E: 3, M: 3, D: 0 }, levels } });
    const out: any = ecmlForLearner({ identifier: 'do_ecml', primaryCategory: 'Dynamic Course Assessment', body }, 'u1');
    expect(out.body.theme.stage[0]['org.ekstep.questionset'][0]['org.ekstep.question'].map((q: any) => q.id)).toEqual(['a1', 'b2']);
  });

  it("caps with the content's own multiplier (positive)", () => {
    const out: any = ecmlForLearner({ ...content(), multiplier: 3 }, 'u1');
    expect(JSON.parse(out.body).theme.stage[0]['org.ekstep.questionset'][0]['org.ekstep.question']).toHaveLength(2);
    const tight: any = ecmlForLearner({ ...content(), multiplier: 4 }, 'u1');
    expect(JSON.parse(tight.body).theme.stage[0]['org.ekstep.questionset'][0]['org.ekstep.question']).toEqual([]);
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
      expect(isDynamicAssessUnavailable(out)).toBe(true);
    }
  });

  it('does not mark playable or non-Dynamic content as unavailable (negative)', () => {
    const body = JSON.stringify({ theme: { stage: [] } });
    expect(isDynamicAssessUnavailable(ecmlForLearner({ identifier: 'do_e', primaryCategory: 'Dynamic Course Assessment', body }, 'u1'))).toBe(false);
    expect(isDynamicAssessUnavailable({ identifier: 'do_p', primaryCategory: 'Learning Resource' })).toBe(false);
    expect(isDynamicAssessUnavailable(undefined)).toBe(false);
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
