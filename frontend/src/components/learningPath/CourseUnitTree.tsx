import { FiCheckCircle, FiCircle, FiFolder } from 'react-icons/fi';
import type { LPUnitNode } from '@/types/learningPathTypes';

interface CourseUnitTreeProps {
  nodes: LPUnitNode[];
  /** Merged course/path `contentStatus` — used to tick off completed leaves. */
  contentStatus?: Record<string, number>;
  activeContentId?: string | null;
  onOpenContent: (contentId: string) => void;
  untitledLabel: string;
  depth?: number;
}

const COMPLETE_STATUS = 2;

/**
 * The units/leaves inside a Course, rendered as an indented tree under its rail
 * row. Mirrors `CollectionSidebar`'s `ExpandedUnitContent` — sub-units are
 * labels, leaves are clickable rows — but reads from the Learning Path's own
 * `LPUnitNode` model instead of the raw hierarchy.
 */
export function CourseUnitTree({
  nodes,
  contentStatus,
  activeContentId = null,
  onOpenContent,
  untitledLabel,
  depth = 0,
}: CourseUnitTreeProps) {
  if (nodes.length === 0) return null;

  return (
    <div
      className={`flex flex-col gap-1 ${depth > 0 ? 'ml-2 border-l-2 border-sunbird-gray-e5 pl-3' : ''}`}
      data-testid="course-unit-tree"
    >
      {nodes.map((node) => {
        if (node.isUnit) {
          return (
            <div key={node.identifier} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 py-1">
                <FiFolder className="h-3 w-3 shrink-0 text-sunbird-gray-75" />
                <span className="truncate text-[0.75rem] font-medium text-sunbird-gray-4a">
                  {node.name || untitledLabel}
                </span>
              </div>
              <CourseUnitTree
                nodes={node.children}
                contentStatus={contentStatus}
                activeContentId={activeContentId}
                onOpenContent={onOpenContent}
                untitledLabel={untitledLabel}
                depth={depth + 1}
              />
            </div>
          );
        }

        const isDone = contentStatus?.[node.identifier] === COMPLETE_STATUS;
        const isActive = activeContentId === node.identifier;

        return (
          <button
            key={node.identifier}
            type="button"
            onClick={() => onOpenContent(node.identifier)}
            data-testid="course-unit-leaf"
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-sunbird-gray-f3 ${
              isActive ? 'bg-sunbird-gray-f3' : 'bg-transparent'
            }`}
          >
            {isDone ? (
              <FiCheckCircle className="h-3.5 w-3.5 shrink-0 text-sunbird-brick" />
            ) : (
              <FiCircle className="h-3.5 w-3.5 shrink-0 text-sunbird-gray-b2" />
            )}
            <span
              className={`truncate text-[0.75rem] ${isActive ? 'font-medium text-foreground' : 'text-sunbird-gray-4a'}`}
            >
              {node.name || untitledLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
