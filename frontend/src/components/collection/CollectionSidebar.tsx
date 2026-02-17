import { Link } from "react-router-dom";
import { useState } from "react";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible"
import { VideoIcon, DocumentIcon } from "./CollectionIcons";
import type { Module } from "@/types/collectionTypes"

interface CollectionSidebarProps {
  modules: Module[];
  expandedModules: string[];
  toggleModule: (moduleId: string) => void;
  collectionId: string | undefined;
}

const CollectionSidebar = ({ modules, expandedModules, toggleModule, collectionId }: CollectionSidebarProps) => {
  // track which lesson is active so we can show the border/shadow starting
  // on the first lesson and move it when the user clicks another one
  const [activeLessonId, setActiveLessonId] = useState<string | null>(
    modules?.[0]?.lessons?.[0]?.id ?? null
  );

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
                    const isActive = activeLessonId === lesson.id;
                    return (
                      <Link
                        key={lesson.id}
                        to={
                          lesson.type === "video"
                            ? `/content/${lesson.id}`
                            : `/course/${collectionId}/lesson/${lesson.id}`
                        }
                        onClick={() => setActiveLessonId(lesson.id)}
                        className={`flex items-center gap-3 rounded-[10px] px-4 py-3 hover:bg-gray-200 transition-colors w-full h-[70px] ${isActive
                          ? 'border border-sunbird-brick bg-white shadow-[0_1px_14px_#0000001A] opacity-100'
                          : 'border border-transparent bg-white shadow-[0_1px_14px_#0000001A] opacity-90'
                          }`}
                      >
                        {lesson.type === "video" ? <VideoIcon /> : <DocumentIcon />}
                        <span className="flex-1 text-base leading-snug">
                          {lesson.title}
                        </span>
                        <span className="text-sm text-muted-foreground flex-shrink-0 font-medium">
                          {lesson.duration}
                        </span>
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
