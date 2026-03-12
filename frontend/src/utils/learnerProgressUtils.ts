import type { EnrollmentCompletion, LearnerProgress, LearnerProgressApiItem, ProgressBucket } from "@/types/reports";

export const STATUS_MAP: Record<number, LearnerProgress["status"]> = {
  0: "Not Started",
  1: "In Progress",
  2: "Completed",
};

/** Extract YYYY-MM-DD from an ISO datetime string */
export function toDateOnly(isoString: string): string {
  return isoString.slice(0, 10);
}

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

  const batchStart = new Date(batchStartDate);
  batchStart.setHours(0, 0, 0, 0);

  const buckets: EnrollmentCompletion[] = Array.from({ length: NUM_WEEKS }, (_, i) => ({
    label: `Week ${i + 1}`,
    enrolled: 0,
    completed: 0,
  }));

  const weekIndex = (isoString: string): number => {
    const d = new Date(isoString);
    const diffDays = Math.floor((d.getTime() - batchStart.getTime()) / 86_400_000);
    return Math.floor(diffDays / 7); // 0-indexed
  };

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

export function mapApiItemToLearnerProgress(item: LearnerProgressApiItem): LearnerProgress {
  const nameParts = [item.userDetails.firstName, item.userDetails.lastName].filter(Boolean);
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
    enrollmentDate: toDateOnly(item.enrolled_date),
    progressPercent: item.completionpercentage ?? 0,
    status: STATUS_MAP[item.status] ?? "Not Started",
    lastActiveDate: toDateOnly(item.datetime),
    certificateStatus,
  };
}
