import type { SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { CiCircleCheck } from "react-icons/ci";
import { FiLock } from "react-icons/fi";
import { VideoIcon, DocumentIcon } from "./CollectionIcons";
import { useToast } from "@/hooks/useToast";
import type { HierarchyContentNode } from "@/types/collectionTypes";
import type { ContentAttemptInfo } from "@/services/collection/enrollmentMapper";

function contentTypeFromMime(mimeType?: string): "video" | "document" {
  if (!mimeType) return "document";
  const lower = mimeType.toLowerCase();
  return lower.startsWith("video/") ? "video" : "document";
}

function getStatusLabel(status: number | undefined): string {
  if (status === 2) return "courseDetails.contentStatusCompleted";
  if (status === 1) return "courseDetails.contentStatusInProgress";
  return "courseDetails.contentStatusNotViewed";
}

export interface ContentRowProps {
  node: HierarchyContentNode;
  href: string;
  contentBlocked: boolean;
  isActive: boolean;
  contentStatusMap?: Record<string, number>;
  contentAttemptInfoMap?: Record<string, ContentAttemptInfo>;
  /** Sequential access: an earlier content isn't complete yet, so this one isn't reachable. */
  isLocked?: boolean;
  t: (key: string, data?: Record<string, unknown>) => string;
}

export default function ContentRow({
  node,
  href,
  contentBlocked,
  isActive,
  contentStatusMap,
  contentAttemptInfoMap,
  isLocked = false,
  t,
}: ContentRowProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const type = contentTypeFromMime(node.mimeType);
  const status = contentStatusMap?.[node.identifier];
  const showStatus = contentStatusMap !== undefined;

  const isSelfAssess = (node.contentType ?? "") === "SelfAssess";
  const isQuestionSet = (node.mimeType ?? "") === "application/vnd.sunbird.questionset";
  const isScorm = (node.mimeType ?? "") === "application/vnd.ekstep.scorm-archive";
  const isAssessmentContent = isSelfAssess || isQuestionSet || isScorm;
  const isHardBlockedAssessment = isSelfAssess || isQuestionSet;
  const maxAttempts = node.maxAttempts;
  const attemptInfo = contentAttemptInfoMap?.[node.identifier];
  const attemptCount = attemptInfo?.attemptCount ?? 0;
  const isDisabledByAttempts =
    isHardBlockedAssessment &&
    maxAttempts != null &&
    typeof maxAttempts === "number" &&
    attemptCount >= maxAttempts;
  const isLastAttempt =
    isAssessmentContent &&
    maxAttempts != null &&
    typeof maxAttempts === "number" &&
    maxAttempts - attemptCount === 1 &&
    !isDisabledByAttempts;

  const baseClass = contentBlocked || isLocked
    ? "flex items-center gap-3 rounded-xs px-4 py-3 w-full h-[4.375rem] border border-transparent bg-white shadow-sunbird-sm opacity-60 pointer-events-none cursor-not-allowed select-none"
    : isDisabledByAttempts
      ? "flex items-center gap-3 rounded-xs px-4 py-3 w-full h-[4.375rem] border border-transparent bg-white shadow-sunbird-sm cursor-not-allowed select-none"
      : `flex items-center gap-3 rounded-xs px-4 py-3 w-full h-[4.375rem] ${isActive
        ? "border border-sunbird-theme-accent bg-white shadow-sunbird-sm opacity-100"
        : "border border-transparent bg-white shadow-sunbird-sm opacity-90"
      }`;
  const interactiveClass = contentBlocked || isLocked ? "" : (isDisabledByAttempts ? "" : "hover:bg-gray-200 transition-colors cursor-pointer");

  const title = node.name ?? "Untitled";
  const showAttempts =
    isAssessmentContent &&
    maxAttempts != null &&
    typeof maxAttempts === "number" &&
    contentAttemptInfoMap !== undefined;
  const content = (
    <>
      <span className={isDisabledByAttempts ? "opacity-60" : ""}>{type === "video" ? <VideoIcon /> : <DocumentIcon />}</span>
      <span className={`flex-1 text-base leading-snug flex items-center gap-2 min-w-0 ${isDisabledByAttempts ? "opacity-60" : ""}`}>
        <span className="truncate">{title}</span>
        {showAttempts && (
          <span className="group/attempt relative flex-shrink-0">
            <span className="text-xs font-medium text-muted-foreground cursor-default">
              {attemptCount}/{maxAttempts}
            </span>
            <span
              role="tooltip"
              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 text-xs font-normal text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover/attempt:opacity-100 transition-opacity duration-0 pointer-events-none z-10"
            >
              {t("courseDetails.attemptsLabel", { current: attemptCount, max: maxAttempts })}
            </span>
          </span>
        )}
      </span>
      {isLocked ? (
        <FiLock
          role="img"
          aria-label={t("courseDetails.contentLocked")}
          className="w-4 h-4 flex-shrink-0 text-muted-foreground"
        />
      ) : showStatus && (
        <span
          className={`font-rubik font-normal text-[0.625rem] leading-[100%] flex-shrink-0 flex flex-col items-end gap-0.5 ${
            status === 2
              ? "text-sunbird-status-completed-text"
              : status === 1
                ? "text-sunbird-status-ongoing-border"
                : "text-muted-foreground"
          }`}
        >
          <span className="flex items-center gap-1">
            {status === 2 && <CiCircleCheck className="w-3.5 h-3.5 text-sunbird-status-completed-text" />}
            {status === 1 && <HiOutlineExclamationCircle className="w-3.5 h-3.5 text-sunbird-status-ongoing-border" />}
            {t(getStatusLabel(status))}
          </span>
          {status === 2 && isAssessmentContent && attemptInfo?.bestScore && (
            <span className="text-[0.625rem] text-gray-600">
              {t("courseDetails.scoreLabel", { score: attemptInfo.bestScore.totalScore, max: attemptInfo.bestScore.totalMaxScore })}
            </span>
          )}
        </span>
      )}
    </>
  );

  const handleClick = (e: SyntheticEvent) => {
    if (contentBlocked || isLocked) return;
    e.preventDefault();
    if (isDisabledByAttempts) {
      toast({ title: t("courseDetails.selfAssessMaxAttempt"), variant: "destructive" });
      return;
    }
    if (isLastAttempt) {
      navigate(href);
    }
  };

  // A locked row is fully inert: no click, and no keyboard entry either (pointer-events-none
  // alone wouldn't stop Enter/Space on the attempts-exhausted branch below).
  const attemptsInteractive = isDisabledByAttempts && !isLocked;

  if (contentBlocked || isDisabledByAttempts || isLocked) {
    return (
      <div
        className={`${baseClass} ${interactiveClass}`}
        aria-disabled="true"
        onClick={attemptsInteractive ? handleClick : undefined}
        onKeyDown={
          attemptsInteractive
            ? (e) => { if (e.key === "Enter" || e.key === " ") { handleClick(e); } }
            : undefined
        }
        role={attemptsInteractive ? "button" : undefined}
        tabIndex={attemptsInteractive ? 0 : undefined}
      >
        {content}
      </div>
    );
  }

  if (isLastAttempt) {
    return (
      <button
        type="button"
        className={`${baseClass} ${interactiveClass} text-left bg-transparent border-none`}
        onClick={handleClick}
        data-edataid="content-row-click"
        data-pageid="collection-detail"
        data-objectid={node.identifier}
        data-objecttype="Content"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={href}
      className={`${baseClass} ${interactiveClass}`}
      data-edataid="content-row-click"
      data-pageid="collection-detail"
      data-objectid={node.identifier}
      data-objecttype="Content"
    >
      {content}
    </Link>
    
  );
}