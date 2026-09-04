import type { HierarchyContentNode } from "../../types/collectionTypes";
import { getLeafContentIdsFromHierarchy } from "./hierarchyTree";

/** Content state 2 = completed (see `getContentStatusMap` in `enrollmentMapper.ts`). */
const COMPLETED = 2;

/**
 * Sequential access: a learner must finish the current content before the next
 * one opens. Everything up to *and including* the first incomplete leaf stays
 * unlocked; everything after it is locked.
 *
 * Two deliberate properties:
 *
 *  1. Completed content is never locked. Course hierarchies get edited — insert
 *     a leaf at position 2 and the order shifts, leaving an incomplete item
 *     ahead of ones already finished. Without this, finished work would re-lock.
 *
 *  2. No status map (the `content/state/read` call failed, or the viewer is a
 *     creator/mentor and was never given one) means nothing is locked. Failing
 *     open is intentional: a network blip shouldn't wall a learner out of a
 *     course they're partway through. Do not "fix" this into locking everything.
 *
 * Ordering comes from `getLeafContentIdsFromHierarchy`, so the sequence is
 * course-wide and depth-first — it continues across unit boundaries rather
 * than restarting per unit.
 */
export function getLockedContentIds(
  hierarchyRoot: HierarchyContentNode | null | undefined,
  contentStatusMap: Record<string, number> | undefined
): Set<string> {
  const locked = new Set<string>();
  if (!hierarchyRoot || !contentStatusMap) return locked;

  const leafIds = getLeafContentIdsFromHierarchy(hierarchyRoot);
  let seenIncomplete = false;

  for (const id of leafIds) {
    const isCompleted = contentStatusMap[id] === COMPLETED;
    if (seenIncomplete && !isCompleted) {
      locked.add(id);
    }
    if (!isCompleted) {
      seenIncomplete = true;
    }
  }

  return locked;
}
