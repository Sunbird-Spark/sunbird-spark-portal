import { Link } from "react-router-dom";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { CiCircleCheck } from "react-icons/ci";
import { VideoIcon, DocumentIcon } from "./CollectionIcons";
import type { HierarchyContentNode } from "@/types/collectionTypes";

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
  t: (key: string) => string;
}

export default function ContentRow({
  node,
  href,
  contentBlocked,
  isActive,
  contentStatusMap,
  t,
}: ContentRowProps) {
  const type = contentTypeFromMime(node.mimeType);
  const status = contentStatusMap?.[node.identifier];
  const showStatus = contentStatusMap !== undefined;
  const baseClass = contentBlocked
    ? "flex items-center gap-3 rounded-[10px] px-4 py-3 w-full h-[70px] border border-transparent bg-white shadow-[0_1px_14px_#0000001A] opacity-60 pointer-events-none cursor-not-allowed select-none"
    : `flex items-center gap-3 rounded-[10px] px-4 py-3 w-full h-[70px] ${isActive
      ? "border border-sunbird-brick bg-white shadow-[0_1px_14px_#0000001A] opacity-100"
      : "border border-transparent bg-white shadow-[0_1px_14px_#0000001A] opacity-90"
    }`;
  const interactiveClass = contentBlocked ? "" : "hover:bg-gray-200 transition-colors cursor-pointer";

  const title = node.name ?? "Untitled";
  const content = (
    <>
      {type === "video" ? <VideoIcon /> : <DocumentIcon />}
      <span className="flex-1 text-base leading-snug">{title}</span>
      {showStatus && (
        <span
          className={`font-rubik font-normal text-[10px] leading-[100%] flex-shrink-0 flex items-center gap-1 ${
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

  if (contentBlocked) {
    return (
      <div className={`${baseClass} ${interactiveClass}`} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link to={href} className={`${baseClass} ${interactiveClass}`}>
      {content}
    </Link>
  );
}
