/**
 * Durable fallback for Learning Path assessment scores/attempts.
 *
 * The Viewer Service does not persist score/attempts anywhere the client can
 * read back: the live captures of `/v1/summary/list` and `/v1/view/read` carry
 * none, and `/v1/assessment/read` (the one endpoint that might) has never been
 * called in production. Meanwhile the in-memory `['viewerSummary']` query cache
 * that DOES hold an optimistic score is wiped by the very next
 * `invalidateQueries` refetch, and by any page reload.
 *
 * This store survives both: it is `localStorage`-backed, so a submitted score
 * outlives cache invalidation, reloads and tab closes, until the day the
 * Viewer Service actually returns the data itself.
 */

export interface StoredAssessmentScore {
  score: number;
  maxScore: number;
  attempts: number;
}

const STORAGE_KEY = 'lp.assessmentScores.v1';

type StoredMap = Record<string, StoredAssessmentScore>;

function scoreKey(userId: string, collectionId: string, contentId: string): string {
  return `${userId}:${collectionId}:${contentId}`;
}

function readAll(): StoredMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as StoredMap) : {};
  } catch {
    // Corrupt/inaccessible storage (private browsing, quota, hand-edited value) -
    // degrade to "no local score" rather than throwing.
    return {};
  }
}

function writeAll(map: StoredMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Storage full/unavailable - the write is lost, but nothing should crash for it.
  }
}

/**
 * All stored entries for one enrolment's collection, keyed by leaf `contentId`
 * (the `userId`/`collectionId` prefix stripped). Used to build the rail/gate's
 * `contentId -> info` map without the caller knowing the storage key format.
 */
export function getAllStoredForCollection(userId: string, collectionId: string): Record<string, StoredAssessmentScore> {
  const prefix = `${userId}:${collectionId}:`;
  const result: Record<string, StoredAssessmentScore> = {};
  Object.entries(readAll()).forEach(([key, value]) => {
    if (key.startsWith(prefix)) result[key.slice(prefix.length)] = value;
  });
  return result;
}

/** Read the stored best score/attempts for one content, if any. */
export function getStoredAssessmentScore(
  userId: string,
  collectionId: string,
  contentId: string
): StoredAssessmentScore | undefined {
  return readAll()[scoreKey(userId, collectionId, contentId)];
}

/**
 * Merge a new attempt's score into the store: keep the higher score (a weaker
 * retry must never lower a learner's best), keep a known non-zero max over a
 * later 0 (a QUML_SUMMARY-only submission can report max 0), and increment
 * attempts. Mirrors `mergeAssessment` in `useViewerSummary.ts`, which applies
 * the same rules to the in-memory cache.
 */
export function recordAssessmentScore(
  userId: string,
  collectionId: string,
  contentId: string,
  next: { score: number; maxScore: number }
): StoredAssessmentScore {
  const all = readAll();
  const key = scoreKey(userId, collectionId, contentId);
  const previous = all[key];
  const merged: StoredAssessmentScore = {
    score: previous ? Math.max(previous.score, next.score) : next.score,
    maxScore: next.maxScore || previous?.maxScore || 0,
    attempts: (previous?.attempts ?? 0) + 1,
  };
  all[key] = merged;
  writeAll(all);
  return merged;
}
