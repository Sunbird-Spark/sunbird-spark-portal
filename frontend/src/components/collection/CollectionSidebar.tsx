import { Link } from "react-router-dom";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import { FiCheck, FiLoader } from "react-icons/fi";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";
import { VideoIcon, DocumentIcon } from "./CollectionIcons";
import { useAppI18n } from "@/hooks/useAppI18n";
import type { Lesson, Module } from "@/types/collectionTypes";

function getLessonHref(lesson: Lesson, collectionId: string): string {
  const mime = (lesson.mimeType ?? '').toLowerCase();
  const isCollection = mime === 'application/vnd.ekstep.content-collection';
  return isCollection ? `/collection/${lesson.id}` : `/collection/${collectionId}/content/${lesson.id}`;
}

/** 0 = Not started, 1 = In progress, 2 = Completed */
export type ContentStatus = 0 | 1 | 2;

interface CollectionSidebarProps {
  collectionId: string;
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
  modules,
  expandedModules,
  toggleModule,
  activeLessonId = null,
  contentBlocked = false,
  contentStatusMap,
}: CollectionSidebarProps) => {
  const { t } = useAppI18n();
  return (
    <div className="space-y-3">
      {modules.map((module) => {
        const isExpanded = expandedModules.includes(module.id);

        return (
          <Collapsible
            key={module.id}
            open={isExpanded}
            onOpenChange={() => toggleModule(module.id)}
          >
            <div className="bg-white rounded-xl border border-gray-100 transition-all duration-300 overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full p-4 flex items-start justify-between text-left hover:bg-gray-50 transition-colors">
                  <div className="flex-1 pr-4">
                    <h3 className="font-bold text-lg mb-1 text-foreground">
                      {module.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {module.subtitle}
                    </p>
                  </div>
                  {isExpanded ? (
                    <FiChevronUp className="w-5 h-5 text-sunbird-brick flex-shrink-0 mt-0.5" />
                  ) : (
                    <FiChevronDown className="w-5 h-5 text-sunbird-brick flex-shrink-0 mt-0.5" />
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
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {t(getStatusLabel(lessonStatus))}
                            </span>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={lesson.id}
                        to={getLessonHref(lesson, collectionId)}
                        className={`${baseClass} ${interactiveClass}`}
                      >
                        {lesson.type === "video" ? <VideoIcon /> : <DocumentIcon />}
                        <span className="flex-1 text-base leading-snug">
                          {lesson.title}
                        </span>
                        {showStatus && (
                          <span
                            className={`text-xs flex-shrink-0 flex items-center gap-1 ${
                              lessonStatus === 2
                                ? "text-green-600"
                                : lessonStatus === 1
                                  ? "text-sunbird-brick"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {lessonStatus === 2 && <FiCheck className="w-3.5 h-3.5" />}
                            {lessonStatus === 1 && <FiLoader className="w-3.5 h-3.5" />}
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
