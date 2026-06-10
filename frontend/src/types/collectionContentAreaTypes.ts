import type { BatchListItem } from "@/types/collectionTypes";
import type { CourseProgressCardProps } from "@/components/collection/CourseProgressCard";

/** Access and blocking state for the collection detail view. */
export interface CollectionContentAreaAccessProps {
  isTrackable: boolean;
  isAuthenticated: boolean;
  hasBatchInRoute: boolean;
  isEnrolledInCurrentBatch: boolean;
  contentBlocked: boolean;
  upcomingBatchBlocked: boolean;
  isBatchEnded?: boolean;
  batchStartDateForOverview?: string;
}

/** Player state and handlers for the content player. */
export interface CollectionContentAreaPlayerProps {
  playerMetadata: any;
  playerIsLoading: boolean;
  playerError: any;
  handlePlayerEvent: (event: any) => void;
  handleTelemetryEvent: (event: any) => void;
  showMaxAttemptsExceeded?: boolean;
  cdata?: Array<{ id: string; type: string }>;
  objectRollup?: Record<string, string>;
}

/** Enrollment, progress, batch list and certificate state. */
export interface CollectionContentAreaEnrollmentProps {
  courseProgressProps: CourseProgressCardProps | null | undefined;
  contentStatusMap: any;
  contentAttemptInfoMap?: Record<string, { attemptCount: number }>;
  batches: BatchListItem[] | undefined;
  selectedBatchId: string;
  setSelectedBatchId: (id: string) => void;
  handleJoinCourse: (id: string) => void;
  batchListLoading: boolean;
  joinLoading: boolean;
  batchListError: any;
  joinError: any;
  hasCertificate: boolean;
  firstCertPreviewUrl: string | undefined;
  setCertificatePreviewUrl: (url: string) => void;
  setCertificatePreviewOpen: (open: boolean) => void;
  /** When the user enrolled in this course. Sunbird returns this as epoch ms or an ISO string. */
  enrolledDate?: number | string;
  /** True once /content/state/read has returned at least once. Until then, client-side completion
   *  counts derive from the stale `contentStatus` map and shouldn't drive the "course updated" banner. */
  contentStateFetched?: boolean;
}

/** Sidebar UI state and route identifiers. */
export interface CollectionContentAreaSidebarProps {
  expandedModules: string[];
  toggleModule: (moduleId: string) => void;
  collectionId: string | undefined;
  batchIdParam: string | undefined;
}

/** Creator/viewer flags and user profile for consent. */
export interface CollectionContentAreaCreatorProps {
  isCreatorViewingOwnCollection?: boolean;
  isMentorViewingCourse?: boolean;
  contentCreatorPrivilege?: boolean;
  userProfile?: Record<string, unknown> | null;
  userId?: string | null;
  /** The route to return to when the user exits the collection (used for back navigation). */
  backTo?: string;
}

export interface CollectionContentAreaProps {
  collectionData: any;
  contentId: string | undefined;
  access: CollectionContentAreaAccessProps;
  player: CollectionContentAreaPlayerProps;
  enrollment: CollectionContentAreaEnrollmentProps;
  sidebar: CollectionContentAreaSidebarProps;
  creator?: CollectionContentAreaCreatorProps;
  backTo?: string;
}
