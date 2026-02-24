import { Link } from "react-router-dom";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { CiCircleCheck } from "react-icons/ci";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";
import { VideoIcon, DocumentIcon } from "./CollectionIcons";
import { useAppI18n } from "@/hooks/useAppI18n";
import type { Lesson, Module } from "@/types/collectionTypes";

function getLessonHref(lesson: Lesson, collectionId: string, batchId?: string | null): string {
  const mime = (lesson.mimeType ?? '').toLowerCase();
  const isCollection = mime === 'application/vnd.ekstep.content-collection';
  if (isCollection) return `/collection/${lesson.id}`;
  if (batchId) return `/collection/${collectionId}/batch/${batchId}/content/${lesson.id}`;
  return `/collection/${collectionId}/content/${lesson.id}`;
}

/** 0 = Not started, 1 = In progress, 2 = Completed */
export type ContentStatus = 0 | 1 | 2;

interface CollectionSidebarProps {
  collectionId: string;
  /** When set (trackable + batch in route), lesson links include batch in path. */
  batchId?: string | null;
  modules: Module[];
  expandedModules: string[];
  toggleModule: (moduleId: string) => void;
  activeLessonId?: string | null;
  contentBlocked?: boolean;
  /** Map of content/lesson id to status (0/1/2). When provided, each lesson shows status label. */
  contentStatusMap?: Record<string, number>;
}

function getStatusLabel(status: number | undefined): string {
  if (status === 2) return "courseDetails.contentStatusCompleted";
  if (status === 1) return "courseDetails.contentStatusInProgress";
  return "courseDetails.contentStatusNotViewed";
}

const CollectionSidebar = ({
  collectionId,
  batchId = null,
  modules,
  expandedModules,
  toggleModule,
  activeLessonId = null,
  contentBlocked = false,
  contentStatusMap,
}: CollectionSidebarProps) => {
  const { t } = useAppI18n();
  return (
    <div
      className={`space-y-3 ${contentBlocked ? "opacity-80 select-none" : ""}`}
      aria-disabled={contentBlocked || undefined}
    >
      {modules.map((module) => {
        const isExpanded = expandedModules.includes(module.id);

        return (
          <Collapsible
            key={module.id}
            open={isExpanded}
            onOpenChange={() => toggleModule(module.id)}
          >
            <div
              className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                contentBlocked
                  ? "bg-gray-100 border-gray-200"
                  : "bg-white border-gray-100"
              }`}
            >
              <CollapsibleTrigger asChild>
                <button
                  className={`w-full p-4 flex items-start justify-between text-left transition-colors ${
                    contentBlocked
                      ? "cursor-not-allowed text-muted-foreground"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex-1 pr-4">
                    <h3
                      className={`font-bold text-lg mb-1 ${
                        contentBlocked ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {module.title}
                    </h3>
                    <p
                      className={`text-sm ${
                        contentBlocked ? "text-gray-400" : "text-muted-foreground"
                      }`}
                    >
                      {module.subtitle}
                    </p>
                  </div>
                  {isExpanded ? (
                    <FiChevronUp
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        contentBlocked ? "text-muted-foreground" : "text-sunbird-brick"
                      }`}
                    />
                  ) : (
                    <FiChevronDown
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        contentBlocked ? "text-muted-foreground" : "text-sunbird-brick"
                      }`}
                    />
                  )}
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="p-3 pt-0 space-y-2">
                  {module.lessons.map((lesson) => {
                    const isActive =
                      !contentBlocked && activeLessonId === lesson.id;
                    const baseClass = contentBlocked
                      ? "flex items-center gap-3 rounded-[10px] px-4 py-3 w-full h-[70px] border border-transparent bg-white shadow-[0_1px_14px_#0000001A] opacity-60 pointer-events-none cursor-not-allowed select-none"
                      : `flex items-center gap-3 rounded-[10px] px-4 py-3 w-full h-[70px] ${isActive
                        ? 'border border-sunbird-brick bg-white shadow-[0_1px_14px_#0000001A] opacity-100'
                        : 'border border-transparent bg-white shadow-[0_1px_14px_#0000001A] opacity-90'
                        }`;
                    const interactiveClass = contentBlocked
                      ? ""
                      : "hover:bg-gray-200 transition-colors cursor-pointer";

                    const lessonStatus = contentStatusMap?.[lesson.id];
                    const showStatus = contentStatusMap !== undefined;

                    if (contentBlocked) {
                      return (
                        <div
                          key={lesson.id}
                          className={`${baseClass} ${interactiveClass}`}
                          aria-disabled="true"
                        >
                          {lesson.type === "video" ? <VideoIcon /> : <DocumentIcon />}
                          <span className="flex-1 text-base leading-snug">
                            {lesson.title}
                          </span>
                          {showStatus && (
                            <span className="font-rubik font-normal text-[10px] leading-[100%] text-muted-foreground flex-shrink-0">
                              {t(getStatusLabel(lessonStatus))}
                            </span>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={lesson.id}
                        to={getLessonHref(lesson, collectionId, batchId)}
                        className={`${baseClass} ${interactiveClass}`}
                      >
                        {lesson.type === "video" ? <VideoIcon /> : <DocumentIcon />}
                        <span className="flex-1 text-base leading-snug">
                          {lesson.title}
                        </span>
                        {showStatus && (
                          <span
                            className={`font-rubik font-normal text-[10px] leading-[100%] flex-shrink-0 flex items-center gap-1 ${
                              lessonStatus === 2
                                ? "text-sunbird-status-completed-border"
                                : lessonStatus === 1
                                  ? "text-sunbird-status-ongoing-border"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {lessonStatus === 2 && (
                              <CiCircleCheck className="w-3.5 h-3.5 text-sunbird-status-completed-border" />
                            )}
                            {lessonStatus === 1 && (
                              <HiOutlineExclamationCircle className="w-3.5 h-3.5 text-sunbird-status-ongoing-border" />
                            )}
                            {t(getStatusLabel(lessonStatus))}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
};

export default CollectionSidebar;
