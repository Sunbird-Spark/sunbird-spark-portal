import dayjs from 'dayjs';
import type { AssessmentApiItem, AssessmentRecord, EnrollmentCompletion, LearnerProgress, LearnerProgressApiItem, ProgressBucket } from "@/types/reports";
import { toRelativeTime } from "@/utils/dateUtils";

export const STATUS_MAP: Record<number, LearnerProgress["status"]> = {
  0: "Not Started",
  1: "In Progress",
  2: "Completed",
};

const NUM_WEEKS = 4;

/**
 * Builds weekly enrollment vs completion chart data anchored to batchStartDate.
 * Generates 4 week buckets (Week 1–4). Learners enrolled/completed after week 4
 * are silently excluded from the chart.
 *
 * Returns an empty array when batchStartDate is not provided.
 */
export function buildEnrollmentVsCompletion(
  learners: LearnerProgressApiItem[],
  batchStartDate: string | undefined
): EnrollmentCompletion[] {
  if (!batchStartDate) return [];

  const batchStart = dayjs(batchStartDate).startOf('day');

  const buckets: EnrollmentCompletion[] = Array.from({ length: NUM_WEEKS }, (_, i) => ({
    label: `Week ${i + 1}`,
    enrolled: 0,
    completed: 0,
  }));

  const weekIndex = (isoString: string): number =>
    Math.floor(dayjs(isoString).diff(batchStart, 'day') / 7);

  for (const learner of learners) {
    const enrollWeek = weekIndex(learner.enrolled_date);
    if (enrollWeek >= 0 && enrollWeek < NUM_WEEKS) {
      buckets[enrollWeek]!.enrolled += 1;
    }
    if (learner.status === 2) {
      const completeWeek = weekIndex(learner.datetime);
      if (completeWeek >= 0 && completeWeek < NUM_WEEKS) {
        buckets[completeWeek]!.completed += 1;
      }
    }
  }

  return buckets;
}

const PROGRESS_BUCKET_DEFS = [
  { bucket: "0–25%",   lo: 0,  hi: 25  },
  { bucket: "25–50%",  lo: 25, hi: 50  },
  { bucket: "50–75%",  lo: 50, hi: 75  },
  { bucket: "75–100%", lo: 75, hi: 100 },
] as const;

/**
 * Buckets all learners by their completionpercentage (null → 0).
 * Returns 4 fixed buckets: 0–25%, 25–50%, 50–75%, 75–100%.
 */
export function buildProgressBuckets(
  learners: LearnerProgressApiItem[]
): ProgressBucket[] {
  const counts = [0, 0, 0, 0];
  for (const l of learners) {
    const pct = l.completionpercentage ?? 0;
    if      (pct <= 25) counts[0]!++;
    else if (pct <= 50) counts[1]!++;
    else if (pct <= 75) counts[2]!++;
    else                counts[3]!++;
  }
  return PROGRESS_BUCKET_DEFS.map((b, i) => ({ bucket: b.bucket, count: counts[i]! }));
}

const SCORE_BUCKET_DEFS = [
  { bucket: "0–20"  },
  { bucket: "21–40" },
  { bucket: "41–60" },
  { bucket: "61–80" },
  { bucket: "81–100" },
] as const;

export function buildScoreDistribution(records: AssessmentRecord[]): ProgressBucket[] {
  const counts = [0, 0, 0, 0, 0];
  for (const r of records) {
    const pct = r.percentage;
    if      (pct <= 20) counts[0]!++;
    else if (pct <= 40) counts[1]!++;
    else if (pct <= 60) counts[2]!++;
    else if (pct <= 80) counts[3]!++;
    else                counts[4]!++;
  }
  return SCORE_BUCKET_DEFS.map((b, i) => ({ bucket: b.bucket, count: counts[i]! }));
}

export function mapApiItemToAssessmentRecord(item: AssessmentApiItem): AssessmentRecord {
  const score = item.total_score ?? 0;
  const maxScore = item.total_max_score ?? 0;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return {
    id: item.user_id,
    learnerName: `${item.userDetails?.firstName ?? ''} ${item.userDetails?.lastName ?? ''}`.trim(),
    attemptNumber: item.attempt_count,
    score,
    maxScore,
    percentage,
    attemptDate: dayjs(item.last_attempted_on).format('YYYY-MM-DD'),
  };
}

export function mapApiItemToLearnerProgress(item: LearnerProgressApiItem): LearnerProgress {
  const nameParts = [item.userDetails?.firstName, item.userDetails?.lastName].filter(Boolean);
  const hasCertificate = item.issued_certificates != null;
  const isCompleted = item.completionpercentage === 100 || item.status === 2;
  const certificateStatus: LearnerProgress["certificateStatus"] = hasCertificate
    ? "Issued"
    : isCompleted
    ? "Pending"
    : "N/A";
  return {
    id: item.userid,
    learnerName: nameParts.join(' '),
    enrollmentDate: dayjs(item.enrolled_date).format('YYYY-MM-DD'),
    progressPercent: item.completionpercentage ?? 0,
    status: STATUS_MAP[item.status] ?? "Not Started",
    lastActiveDate: toRelativeTime(item.datetime),
    certificateStatus,
  };
}
