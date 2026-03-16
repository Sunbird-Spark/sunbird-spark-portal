import type { CollectionData } from "@/types/collectionTypes";
import type { CourseProgressCardProps } from "@/components/collection/CourseProgressCard";
import type { CollectionDetailLayoutContentAreaProps } from "./CollectionDetailLayout";

export interface BuildContentAreaArgs {
  displayCollectionData: CollectionData | null;
  contentId: string | undefined;
  isTrackable: boolean;
  isAuthenticated: boolean;
  hasBatchInRoute: boolean;
  isEnrolledInCurrentBatch: boolean;
  contentBlocked: boolean;
  upcomingBatchBlocked: boolean;
  batchStartDateForOverview: string | undefined;
  playerMetadata: unknown;
  playerIsLoading: boolean;
  playerError: Error | null;
  handlePlayerEvent: (event: any) => void;
  handleTelemetryEvent: (event: any) => void;
  maxAttemptsExceeded: boolean;
  courseProgressProps: CourseProgressCardProps | null | undefined;
  contentStatusMap: Record<string, number> | undefined;
  contentAttemptInfoMap: Record<string, { attemptCount: number }> | undefined;
  batches: unknown;
  selectedBatchId: string;
  setSelectedBatchId: (id: string) => void;
  handleJoinCourse: (batchId: string) => void;
  batchListLoading: boolean;
  joinLoading: boolean;
  batchListError: string | undefined;
  joinError: string;
  hasCertificate: boolean;
  firstCertPreviewUrl: string | undefined;
  setCertificatePreviewUrl: (url: string) => void;
  setCertificatePreviewOpen: (open: boolean) => void;
  expandedModules: string[];
  toggleModule: (moduleId: string) => void;
  collectionId: string | undefined;
  batchIdParam: string | undefined;
  isCreatorViewingOwnCollection: boolean;
  isMentorViewingCourse: boolean;
  contentCreatorPrivilege: boolean;
  userProfile: Record<string, unknown> | undefined;
  currentUserId: string | undefined;
  backTo?: string;
}

export function buildCollectionDetailContentArea(
  args: BuildContentAreaArgs
): CollectionDetailLayoutContentAreaProps | null {
  const { displayCollectionData } = args;
  if (!displayCollectionData) return null;
  return {
    collectionData: displayCollectionData,
    contentId: args.contentId,
    access: {
      isTrackable: args.isTrackable,
      isAuthenticated: args.isAuthenticated,
      hasBatchInRoute: args.hasBatchInRoute,
      isEnrolledInCurrentBatch: args.isEnrolledInCurrentBatch,
      contentBlocked: args.contentBlocked,
      upcomingBatchBlocked: args.upcomingBatchBlocked,
      batchStartDateForOverview: args.batchStartDateForOverview,
    },
    player: {
      playerMetadata: args.playerMetadata,
      playerIsLoading: args.playerIsLoading,
      playerError: args.playerError,
      handlePlayerEvent: args.handlePlayerEvent,
      handleTelemetryEvent: args.handleTelemetryEvent,
      showMaxAttemptsExceeded: args.maxAttemptsExceeded,
    },
    enrollment: {
      courseProgressProps: args.courseProgressProps,
      contentStatusMap: args.contentStatusMap,
      contentAttemptInfoMap: args.contentAttemptInfoMap,
      batches: args.batches as CollectionDetailLayoutContentAreaProps["enrollment"]["batches"],
      selectedBatchId: args.selectedBatchId,
      setSelectedBatchId: args.setSelectedBatchId,
      handleJoinCourse: args.handleJoinCourse,
      batchListLoading: args.batchListLoading,
      joinLoading: args.joinLoading,
      batchListError: args.batchListError,
      joinError: args.joinError,
      hasCertificate: args.hasCertificate,
      firstCertPreviewUrl: args.firstCertPreviewUrl,
      setCertificatePreviewUrl: args.setCertificatePreviewUrl,
      setCertificatePreviewOpen: args.setCertificatePreviewOpen,
    },
    sidebar: {
      expandedModules: args.expandedModules,
      toggleModule: args.toggleModule,
      collectionId: args.collectionId,
      batchIdParam: args.batchIdParam,
    },
    creator: {
      isCreatorViewingOwnCollection: args.isCreatorViewingOwnCollection,
      isMentorViewingCourse: args.isMentorViewingCourse,
      contentCreatorPrivilege: args.contentCreatorPrivilege,
      userProfile: args.userProfile,
      userId: args.currentUserId,
    },
    backTo: args.backTo,
  };
}
