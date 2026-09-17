import type { LearningPathModel } from '@/types/learningPathTypes';

export type SkillState = 'held' | 'inProgress' | 'notStarted';

export interface PathSkill {
  code: string;
  state: SkillState;
  /** 0-100. Only meaningful when state is 'inProgress'. */
  percent: number;
  /** True when the role needs it but nothing on this path teaches it. */
  notTaught: boolean;
}

export interface PathSkillSummary {
  skills: PathSkill[];
  held: number;
  required: number;
  /** Readiness against the target role, or undefined when there is no role to judge against. */
  readiness?: number;
}

/**
 * Per-skill status for a learner partway through a Learning Path.
 *
 * WHY THIS IS DERIVED, NOT STORED. The evidence model is deliberately binary - a skill is held or
 * it is not, and "held" means a live row exists (design decision D2 dropped IN_PROGRESS precisely
 * so that attempting something could never look like holding it). But a learner halfway through a
 * path needs to see movement, otherwise every skill reads "not started" until a whole course
 * completes and then several flip at once.
 *
 * So the middle state is computed here from data the page already has - the course's completion
 * percentage and its `skillCodes` - and never written anywhere. The ledger stays binary; only the
 * view gains a third state.
 *
 * A skill taught by more than one course takes the HIGHEST progress of them: the learner is as far
 * along as their best route to it.
 */
export function computePathSkills(
  model: LearningPathModel,
  heldCodes: Set<string>,
  courseProgress: Map<string, { percent: number }>,
  requiredCodes?: string[]
): PathSkillSummary {
  const progressByCode = new Map<string, number>();
  model.levels.forEach((level) =>
    level.courses.forEach((course) => {
      const pct = courseProgress.get(course.identifier)?.percent ?? 0;
      course.skillCodes.forEach((code) =>
        progressByCode.set(code, Math.max(progressByCode.get(code) ?? 0, pct))
      );
    })
  );

  // The role's requirement is the spine when there is one: a skill the role needs but the path
  // never teaches must still be listed, or the learner is told they are further along than they are.
  const taught = new Set(model.allSkillCodes);
  const codes = requiredCodes?.length
    ? [...new Set([...requiredCodes, ...model.allSkillCodes])]
    : model.allSkillCodes;

  const skills: PathSkill[] = codes.map((code) => {
    const pct = progressByCode.get(code) ?? 0;
    const state: SkillState = heldCodes.has(code)
      ? 'held'
      : pct > 0
        ? 'inProgress'
        : 'notStarted';
    return { code, state, percent: state === 'inProgress' ? pct : 0, notTaught: !taught.has(code) };
  });

  const required = requiredCodes?.length ? requiredCodes.length : skills.length;
  const held = requiredCodes?.length
    ? requiredCodes.filter((c) => heldCodes.has(c)).length
    : skills.filter((s) => s.state === 'held').length;

  return {
    skills,
    held,
    required,
    readiness: required > 0 ? Math.round((held / required) * 100) : undefined,
  };
}
