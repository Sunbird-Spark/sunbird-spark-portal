import type { LearnerProgress, LearnerProgressApiItem } from "@/types/reports";

export const STATUS_MAP: Record<number, LearnerProgress["status"]> = {
  0: "Not Started",
  1: "In Progress",
  2: "Completed",
};

/** Extract YYYY-MM-DD from an ISO datetime string */
export function toDateOnly(isoString: string): string {
  return isoString.slice(0, 10);
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
