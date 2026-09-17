import { useMemo } from 'react';
import { useSkillProfile, useSkillFrameworks } from './useSkillProfile';
import { computeCourseProgress } from '@/services/learningPath/learningPathProgress';
import { computePathSkills, type PathSkillSummary } from '@/services/learningPath/pathSkillStatus';
import { skillName } from '@/services/skill';
import type { LearningPathModel } from '@/types/learningPathTypes';
import type { ViewerSummaryRecord } from '@/types/viewerServiceTypes';

export interface UsePathSkillsResult {
  summary: PathSkillSummary | undefined;
  /** Display name for a leaf code, from the framework; de-slugs when the framework lacks it. */
  name: (code: string) => string;
  /** The role this path is built for, when it declares one. */
  targetRole?: string;
  roleName: string;
  isLoading: boolean;
}

/**
 * Skill progress for the path the learner is currently on.
 *
 * Scoped to the path's OWN framework. A learner may hold skills from several frameworks, and
 * counting those toward this programme would overstate readiness - the codes are only comparable
 * within one framework.
 *
 * Requirements come from the framework's role definition rather than from `gap/read`, because the
 * card needs the full required SET to render each skill's state, not just the outstanding count.
 * When the path declares no `targetRole`, it falls back to the path's own skills, which still
 * answers "what does this programme give me, and how far am I".
 */
export function usePathSkills(
  model: LearningPathModel,
  summaryByCollectionId: Map<string, ViewerSummaryRecord>,
  pathSummary?: ViewerSummaryRecord
): UsePathSkillsResult {
  const frameworkId = model.competencyFramework;
  const { skills, isLoading: profileLoading } = useSkillProfile();
  const ids = useMemo(() => (frameworkId ? [frameworkId] : []), [frameworkId]);
  const { metas, vocabularies, isLoading: fwLoading } = useSkillFrameworks(ids);

  const vocab = frameworkId ? vocabularies[frameworkId] : undefined;
  const meta = frameworkId ? metas[frameworkId] : undefined;

  const heldCodes = useMemo(
    () => new Set(skills.filter((s) => s.frameworkId === frameworkId).map((s) => s.skillId)),
    [skills, frameworkId]
  );

  const courseProgress = useMemo(() => {
    const m = new Map<string, { percent: number }>();
    model.levels.forEach((level) =>
      level.courses.forEach((course) => {
        m.set(course.identifier, {
          percent: computeCourseProgress(course, summaryByCollectionId, pathSummary).pct,
        });
      })
    );
    return m;
  }, [model, summaryByCollectionId, pathSummary]);

  const required = model.targetRole ? meta?.roles?.[model.targetRole] : undefined;

  const summary = useMemo(
    () =>
      model.allSkillCodes.length === 0 && !required
        ? undefined
        : computePathSkills(model, heldCodes, courseProgress, required),
    [model, heldCodes, courseProgress, required]
  );

  return {
    summary,
    name: (code: string) => skillName(vocab, code),
    targetRole: model.targetRole,
    roleName: model.targetRole ? skillName(vocab, model.targetRole) : '',
    isLoading: profileLoading || fwLoading,
  };
}
