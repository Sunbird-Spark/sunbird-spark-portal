import type { SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { CiCircleCheck } from "react-icons/ci";
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
  t: (key: string, data?: Record<string, unknown>) => string;
}

export default function ContentRow({
  node,
  href,
  contentBlocked,
  isActive,
  contentStatusMap,
  contentAttemptInfoMap,
  t,
}: ContentRowProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const type = contentTypeFromMime(node.mimeType);
  const status = contentStatusMap?.[node.identifier];
  const showStatus = contentStatusMap !== undefined;

  const isSelfAssess = (node.contentType ?? "") === "SelfAssess";
  const maxAttempts = node.maxAttempts;
  const attemptInfo = contentAttemptInfoMap?.[node.identifier];
  const attemptCount = attemptInfo?.attemptCount ?? 0;
  const isDisabledByAttempts =
    isSelfAssess &&
    maxAttempts != null &&
    typeof maxAttempts === "number" &&
    attemptCount >= maxAttempts;
  const isLastAttempt =
    isSelfAssess &&
    maxAttempts != null &&
    typeof maxAttempts === "number" &&
    maxAttempts - attemptCount === 1 &&
    !isDisabledByAttempts;

  const baseClass = contentBlocked
    ? "flex items-center gap-3 rounded-[0.625rem] px-4 py-3 w-full h-[4.375rem] border border-transparent bg-white shadow-[0_1px_14px_#0000001A] opacity-60 pointer-events-none cursor-not-allowed select-none"
    : isDisabledByAttempts
      ? "flex items-center gap-3 rounded-[0.625rem] px-4 py-3 w-full h-[4.375rem] border border-transparent bg-white shadow-[0_1px_14px_#0000001A] opacity-60 cursor-not-allowed select-none"
      : `flex items-center gap-3 rounded-[0.625rem] px-4 py-3 w-full h-[4.375rem] ${isActive
        ? "border border-sunbird-brick bg-white shadow-[0_1px_14px_#0000001A] opacity-100"
        : "border border-transparent bg-white shadow-[0_1px_14px_#0000001A] opacity-90"
      }`;
  const interactiveClass = contentBlocked ? "" : (isDisabledByAttempts ? "" : "hover:bg-gray-200 transition-colors cursor-pointer");

  const title = node.name ?? "Untitled";
  const showAttempts =
    isSelfAssess &&
    maxAttempts != null &&
    typeof maxAttempts === "number" &&
    contentAttemptInfoMap !== undefined;
  const content = (
    <>
      {type === "video" ? <VideoIcon /> : <DocumentIcon />}
      <span className="flex-1 text-base leading-snug flex items-center gap-2 min-w-0">
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
      {showStatus && (
        <span
          className={`font-rubik font-normal text-[0.625rem] leading-[100%] flex-shrink-0 flex items-center gap-1 ${
            status === 2
              ? "text-sunbird-status-completed-border"
              : status === 1
                ? "text-sunbird-status-ongoing-border"
                : "text-muted-foreground"
          }`}
        >
          {status === 2 && <CiCircleCheck className="w-3.5 h-3.5 text-sunbird-status-completed-border" />}
          {status === 1 && <HiOutlineExclamationCircle className="w-3.5 h-3.5 text-sunbird-status-ongoing-border" />}
          {t(getStatusLabel(status))}
        </span>
      )}
    </>
  );

  const handleClick = (e: SyntheticEvent) => {
    if (contentBlocked) return;
    e.preventDefault();
    if (isDisabledByAttempts) {
      toast({ title: t("courseDetails.selfAssessMaxAttempt"), variant: "destructive" });
      return;
    }
    if (isLastAttempt) {
      navigate(href);
    }
  };

  if (contentBlocked || isDisabledByAttempts) {
    return (
      <div
        className={`${baseClass} ${interactiveClass}`}
        aria-disabled="true"
        onClick={isDisabledByAttempts ? handleClick : undefined}
        onKeyDown={
          isDisabledByAttempts
            ? (e) => { if (e.key === "Enter" || e.key === " ") { handleClick(e); } }
            : undefined
        }
        role={isDisabledByAttempts ? "button" : undefined}
        tabIndex={isDisabledByAttempts ? 0 : undefined}
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
