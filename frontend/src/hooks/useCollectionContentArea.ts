import { useMemo } from "react";
import {
  buildCollectionDetailContentArea,
  type BuildContentAreaArgs,
} from "@/pages/collection/buildCollectionDetailContentArea";

export function useCollectionContentArea(args: BuildContentAreaArgs) {
  return useMemo(
    () => buildCollectionDetailContentArea(args),
    [
      args.displayCollectionData, args.contentId, args.isTrackable, args.isAuthenticated,
      args.hasBatchInRoute, args.isEnrolledInCurrentBatch, args.contentBlocked, args.upcomingBatchBlocked,
      args.isBatchEnded, args.batchStartDateForOverview, args.playerMetadata, args.playerIsLoading,
      args.playerError, args.handlePlayerEvent, args.handleTelemetryEvent, args.maxAttemptsExceeded,
      args.cdata, args.objectRollup, args.courseProgressProps, args.contentStatusMap,
      args.contentAttemptInfoMap, args.batches, args.selectedBatchId, args.setSelectedBatchId,
      args.handleJoinCourse, args.batchListLoading, args.joinLoading, args.batchListError,
      args.joinError, args.hasCertificate, args.firstCertPreviewUrl, args.setCertificatePreviewUrl,
      args.setCertificatePreviewOpen, args.enrolledDate, args.contentStateFetched,
      args.expandedModules, args.toggleModule, args.collectionId, args.batchIdParam,
      args.isCreatorViewingOwnCollection, args.isMentorViewingCourse, args.contentCreatorPrivilege,
      args.userProfile, args.currentUserId, args.backTo,
    ]
  );
}
