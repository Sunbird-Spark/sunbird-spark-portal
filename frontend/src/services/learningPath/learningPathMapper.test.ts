import { describe, it, expect } from 'vitest';
import { parseLearningPath } from './learningPathMapper';
import { LP_HIERARCHY_NO_ASSESSMENTS } from './__fixtures__/lpHierarchyNoAssessments.fixture';
import {
  LP_HIERARCHY_WITH_ASSESSMENTS,
  LP_HIERARCHY_EMPTY,
} from './__fixtures__/lpHierarchyWithAssessments.fixture';

describe('parseLearningPath', () => {
  it('parses the real LP hierarchy (two Levels, no prior/outcome assessment)', () => {
    const model = parseLearningPath(LP_HIERARCHY_NO_ASSESSMENTS);

    expect(model.identifier).toBe('do_2146317230884208641312');
    expect(model.name).toBe('TLP-1');
    expect(model.policy).toBe('Fixed');
    expect(model.priorAssessment).toBeUndefined();
    expect(model.outcomeAssessment).toBeUndefined();
    expect(model.levels).toHaveLength(2);
    expect(model.levels[0]!.name).toBe('Level-1');
    expect(model.levels[0]!.index).toBe(1);
    expect(model.levels[1]!.name).toBe('Level-2');
    expect(model.courseTotal).toBe(2);
    expect(model.leafTotal).toBe(3);
  });

  it('falls back to the union of course skills when the Level node has no skill fields of its own', () => {
    const model = parseLearningPath(LP_HIERARCHY_NO_ASSESSMENTS);

    expect(model.levels[0]!.skills.sort()).toEqual(['Java Programming', 'Python Programming'].sort());
    expect(model.levels[1]!.skills).toEqual(['JavaScript']);
    expect(model.allSkills.sort()).toEqual(['Java Programming', 'JavaScript', 'Python Programming'].sort());
  });

  it('marks no course as an assessment course when leaves are pdf/epub/video', () => {
    const model = parseLearningPath(LP_HIERARCHY_NO_ASSESSMENTS);

    model.levels.forEach((level) => {
      level.courses.forEach((course) => {
        expect(course.isAssessmentCourse).toBe(false);
      });
    });
  });

  it('unwraps a single-assessment-course first Level into priorAssessment and a single-assessment-course last Level into outcomeAssessment', () => {
    const model = parseLearningPath(LP_HIERARCHY_WITH_ASSESSMENTS);

    expect(model.priorAssessment).toBeDefined();
    expect(model.priorAssessment?.identifier).toBe('course_prior');
    expect(model.priorAssessment?.isAssessmentCourse).toBe(true);

    expect(model.outcomeAssessment).toBeDefined();
    expect(model.outcomeAssessment?.identifier).toBe('course_outcome');
    expect(model.outcomeAssessment?.isAssessmentCourse).toBe(true);

    // Only the middle Level remains as a content Level.
    expect(model.levels).toHaveLength(1);
    expect(model.levels[0]!.identifier).toBe('level_1');
  });

  it('keeps a mid-level assessment course as a normal course in its Level (not unwrapped)', () => {
    const model = parseLearningPath(LP_HIERARCHY_WITH_ASSESSMENTS);

    const midLevel = model.levels[0]!;
    expect(midLevel.courses).toHaveLength(2);
    const assessCourse = midLevel.courses.find((c) => c.identifier === 'course_1_assess');
    expect(assessCourse?.isAssessmentCourse).toBe(true);
  });

  it('reads level skills from the Level node competencies field when present', () => {
    const model = parseLearningPath(LP_HIERARCHY_WITH_ASSESSMENTS);
    expect(model.levels[0]!.skills).toEqual(['Data literacy', 'Spreadsheet basics']);
  });

  it('resolves policy from the root node, defaulting to Fixed for an unknown value', () => {
    const model = parseLearningPath(LP_HIERARCHY_WITH_ASSESSMENTS);
    expect(model.policy).toBe('Diagnostic');

    const unknownPolicy = parseLearningPath({ ...LP_HIERARCHY_NO_ASSESSMENTS, policy: 'Bogus' });
    expect(unknownPolicy.policy).toBe('Fixed');
  });

  // Regression: the live authoring tool writes the lowercase design-label
  // spelling ("adaptive", "strict") rather than the design doc's PascalCase
  // codes ("Diagnostic", "Fixed") - both must resolve to the same policy.
  it.each([
    ['adaptive', 'Diagnostic'],
    ['Adaptive', 'Diagnostic'],
    ['diagnostic', 'Diagnostic'],
    ['strict', 'Fixed'],
    ['Strict', 'Fixed'],
    ['fixed', 'Fixed'],
    ['prior learning', 'PriorLearning'],
    ['prior_learning', 'PriorLearning'],
    ['PriorLearning', 'PriorLearning'],
  ])('normalises policy=%s to %s', (raw, expected) => {
    const model = parseLearningPath({ ...LP_HIERARCHY_NO_ASSESSMENTS, policy: raw });
    expect(model.policy).toBe(expected);
  });

  it('handles an empty Learning Path with no Levels', () => {
    const model = parseLearningPath(LP_HIERARCHY_EMPTY);

    expect(model.levels).toEqual([]);
    expect(model.priorAssessment).toBeUndefined();
    expect(model.outcomeAssessment).toBeUndefined();
    expect(model.courseTotal).toBe(0);
    expect(model.allSkills).toEqual([]);
  });

  it('preserves each course\'s own units (with their leaves) alongside the flattened leafIds', () => {
    const model = parseLearningPath(LP_HIERARCHY_NO_ASSESSMENTS);
    const course = model.levels[0]!.courses[0]!;

    expect(course.units).toHaveLength(2);
    expect(course.units!.map((u) => u.name)).toEqual(['Unit-1', 'Unit-2']);
    expect(course.units!.every((u) => u.isUnit)).toBe(true);

    const unit1 = course.units![0]!;
    expect(unit1.children).toHaveLength(1);
    expect(unit1.children[0]!.name).toBe('LP-Content-1-JavaProg');
    expect(unit1.children[0]!.isUnit).toBe(false);
    // A unit rolls up the leaf ids beneath it; a leaf carries its own id.
    expect(unit1.leafIds).toEqual(['do_21463158442296934411']);
    expect(unit1.children[0]!.leafIds).toEqual(['do_21463158442296934411']);
    // The flattened list stays the source of truth for progress maths.
    expect(course.leafIds).toEqual(course.units!.flatMap((u) => u.leafIds));
  });

  it('returns an empty model for a null/undefined root', () => {
    expect(parseLearningPath(null)).toMatchObject({ identifier: '', levels: [], policy: 'Fixed' });
    expect(parseLearningPath(undefined)).toMatchObject({ identifier: '', levels: [], policy: 'Fixed' });
  });
});
