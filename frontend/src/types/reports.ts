// ============================================================
// Report Module – TypeScript Interfaces & API Contracts
// ============================================================

/* ---------- Generic / Shared ---------- */

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FilterOption {
  label: string;
  value: string;
}

export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

/* ---------- MODULE 1 – Platform Reports ---------- */

export interface ContentStatusCount {
  status: string;
  count: number;
}

export type ContentStatusSummaryFacet =
  | { facet: 'status'; values: StatusFacetValue[] }
  | { facet: 'createdBy'; values: CreatedByFacetValue[] }
  | { facet: 'primaryCategory'; values: CategoryFacetValue[] };

export interface ContentStatusSummaryApiResult {
  data: ContentStatusSummaryFacet[];
  count: number;
}

export interface ContentByGroup {
  group: string;
  count: number;
}

export interface TopCreator {
  name: string;
  count: number;
}

export interface PopularContent {
  id: string;
  title: string;
  enrollments: number;
  views: number;
  type: string;
}

export interface UserGrowthPoint {
  date: string;
  users: number;
}

export interface UserDemographic {
  label: string;
  count: number;
}

export interface AdminCourseSummary {
  id: string;
  courseName: string;
  totalEnrolled: number;
  totalCompleted: number;
  completionPercent: number;
  certificatesIssued: number;
  lastUpdated?: string;
}

export interface StatusFacetValue {
  status: string;
  count: number;
}

export interface CreatedByFacetValue {
  createdBy: string;
  count: number;
  userDetails?: { firstName: string; lastName?: string };
}

export interface CategoryFacetValue {
  primaryCategory: string;
  count: number;
}

/** Raw shape returned by POST /observability/v1/reports for org-course-enrolment-summary */
export interface OrgCourseEnrolmentApiItem {
  courseid: string;
  collectionDetails?: { name?: string; identifier?: string; contentType?: string };
  total_enrolled?: number;
  total_completed?: number;
  certificates_issued?: number;
}

export interface OrgCourseEnrolmentResult {
  data: OrgCourseEnrolmentApiItem[];
  count: number;
}

/* ---------- MODULE 2 – Course Report ---------- */

export interface EnrollmentCompletion {
  label: string;
  enrolled: number;
  completed: number;
}

export interface ProgressBucket {
  bucket: string;
  count: number;
}

export interface LearnerProgress {
  id: string;
  learnerName: string;
  enrollmentDate: string;
  progressPercent: number;
  status: "In Progress" | "Completed" | "Not Started";
  lastActiveDate: string;
  certificateStatus: "Issued" | "Pending" | "N/A";
}

/** Raw shape returned by POST /observability/v1/reports for user-course-enrolments */
export interface UserCourseEnrolmentApiItem {
  courseid: string;
  collectionDetails?: {
    name: string;
    identifier: string;
    contentType: string;
  } | null;
  completionpercentage: number | null;
  /** 0 = Not Started, 1 = In Progress, 2 = Completed */
  status: number;
  enrolled_date: string;
  datetime: string;
  issued_certificates: Array<{
    identifier: string;
    lastIssuedOn: string;
    name: string;
    templateUrl: string;
    token: string;
    type: string;
  }> | null;
}

export interface UserCourseEnrolmentResult {
  data: UserCourseEnrolmentApiItem[];
  count: number;
}

export interface LearnerProgressResult {
  data: LearnerProgressApiItem[];
  /** Server-authoritative total enrolment count */
  count: number;
}

/** Raw shape returned by POST /observability/v1/reports for course-batch-enrolments */
export interface LearnerProgressApiItem {
  userid: string;
  userDetails: {
    firstName: string;
    lastName?: string;
  };
  enrolled_date: string;
  completionpercentage: number | null;
  /** 0 = Not Started, 1 = In Progress, 2 = Completed */
  status: number;
  datetime: string;
  issued_certificates: Array<{
    identifier: string;
    lastIssuedOn: string;
    name: string;
    templateUrl: string;
    token: string;
    type: string;
  }> | null;
}

/** Raw shape returned by POST /observability/v1/reports for course-assessment-summary */
export interface AssessmentApiItem {
  user_id: string;
  attempt_count: number;
  total_score: number | null;
  total_max_score: number | null;
  userDetails: { firstName: string; lastName?: string };
  last_attempted_on: string;
}

export interface AssessmentResult {
  data: AssessmentApiItem[];
  count: number;
}

/** Raw shape returned by POST /observability/v1/reports for user-assessment-summary */
export interface UserAssessmentApiItem {
  attempt_id: string;
  course_id: string;
  content_id: string;
  batch_id: string;
  total_score: number | null;
  total_max_score: number | null;
  last_attempted_on: string;
  collectionDetails?: {
    name: string;
    identifier: string;
    contentType: string;
  } | null;
  /** Optional — absent in some API records */
  contentDetails?: {
    name: string;
    identifier: string;
    contentType: string;
  };
}

export interface UserAssessmentResult {
  data: UserAssessmentApiItem[];
  count: number;
}

export interface AssessmentRecord {
  id: string;
  learnerName: string;
  attemptNumber: number;
  score: number;
  maxScore: number;
  percentage: number;
  passFail?: "Pass" | "Fail";
  attemptDate: string;
}

export interface CourseReportSummary {
  courseId: string;
  courseName: string;
  totalEnrolled: number;
  totalCompleted: number;
  certificatesIssued: number;
  avgScore: number;
}

/* ---------- MODULE 3 – User Profile Report ---------- */

export interface UserReportSummary {
  userId: string;
  userName: string;
  coursesCompleted: number;
  coursesPending: number;
  certificatesIssued: number;
  contentCompleted: number;
  assessmentsCompleted: number;
}

export interface UserCourseProgress {
  id: string;
  courseName: string;
  progressPercent: number;
  status: "In Progress" | "Completed" | "Not Started";
  enrollmentDate: string;
  lastAccessed: string;
}

export interface UserCertificate {
  id: string;
  courseName: string;
  issuedDate: string;
  certificateId: string;
}

export interface UserAssessmentHistory {
  id: string;
  courseName: string;
  assessmentName: string;
  score: number;
  maxScore: number;
  percentage: number;
  attemptDate: string;
}

/* ---------- User Creation Count (user-creation-count report) ---------- */

export interface UserCreationCountApiItem { month: string; userCount: number; }
export interface UserCreationCountResult { data: UserCreationCountApiItem[]; count: number; }

/* ---------- MODULE 4 – User Consent Management ---------- */
// Types live in @/types/consentTypes to keep this file within the 250-line limit.
export type { ConsentStatus, UserConsentApiItem, UserConsentSummaryResult, UserConsentRecord } from './consentTypes';
