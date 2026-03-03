import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";
import { useAppI18n } from "@/hooks/useAppI18n";
import type { HierarchyContentNode } from "@/types/collectionTypes";
import ContentRow from "./ContentRow";

const COLLECTION_MIME = "application/vnd.ekstep.content-collection";

function isCollection(node: HierarchyContentNode): boolean {
  return (node.mimeType ?? "").toLowerCase() === COLLECTION_MIME;
}

function getContentHref(node: HierarchyContentNode, collectionId: string, batchId?: string | null): string {
  if (isCollection(node)) return `/collection/${node.identifier}`;
  if (batchId) return `/collection/${collectionId}/batch/${batchId}/content/${node.identifier}`;
  return `/collection/${collectionId}/content/${node.identifier}`;
}

/** 0 = Not started, 1 = In progress, 2 = Completed */
export type ContentStatus = 0 | 1 | 2;

interface CollectionSidebarProps {
  collectionId: string;
  batchId?: string | null;
  /** Top-level units (main collapsible sections). */
  children: HierarchyContentNode[];
  expandedMainUnitIds: string[];
  toggleMainUnit: (unitId: string) => void;
  activeContentId?: string | null;
  contentBlocked?: boolean;
  contentStatusMap?: Record<string, number>;
}

/** Renders sub-units as labels and content as rows (no collapsibles). */
function ExpandedUnitContent({
  nodes,
  collectionId,
  batchId,
  contentBlocked,
  activeContentId,
  contentStatusMap,
  t,
  depth = 0,
}: {
  nodes: HierarchyContentNode[];
  collectionId: string;
  batchId: string | null;
  contentBlocked: boolean;
  activeContentId: string | null;
  contentStatusMap?: Record<string, number>;
  t: (key: string) => string;
  depth?: number;
}) {
  if (!nodes?.length) return null;

  return (
    <div className={`space-y-2 ${depth > 0 ? "ml-2 border-l-2 border-gray-100 pl-3" : ""}`}>
      {nodes.map((node) => {
        if (isCollection(node)) {
          const childList = node.children ?? [];
          return (
            <div key={node.identifier} className="space-y-2">
              <div
                className="text-sm font-semibold text-muted-foreground py-1"
                aria-label={`Section: ${node.name ?? t('collectionSidebar.untitled')}`}
              >
                {node.name ?? t('collectionSidebar.untitled')}
              </div>
              <ExpandedUnitContent
                nodes={childList}
                collectionId={collectionId}
                batchId={batchId}
                contentBlocked={contentBlocked}
                activeContentId={activeContentId}
                contentStatusMap={contentStatusMap}
                t={t}
                depth={depth + 1}
              />
            </div>
          );
        }

        return (
          <div
            key={node.identifier}
            data-edataid="collection-sidebar-content-click"
            data-pageid="collection-detail"
            data-objectid={node.identifier}
            data-objecttype="Content"
          >
            <ContentRow
              node={node}
              href={getContentHref(node, collectionId, batchId)}
              contentBlocked={contentBlocked}
              isActive={activeContentId === node.identifier}
              contentStatusMap={contentStatusMap}
              t={t}
            />
          </div>
        );
      })}
    </div>
  );
}

const CollectionSidebar = ({
  collectionId,
  batchId = null,
  children: topLevelUnits,
  expandedMainUnitIds,
  toggleMainUnit,
  activeContentId = null,
  contentBlocked = false,
  contentStatusMap,
}: CollectionSidebarProps) => {
  const { t } = useAppI18n();

  return (
    <div
      className={`space-y-3 ${contentBlocked ? "opacity-80 select-none" : ""}`}
      aria-disabled={contentBlocked || undefined}
    >
      {topLevelUnits.map((unit) => {
        const isExpanded = expandedMainUnitIds.includes(unit.identifier);

        return (
          <Collapsible
            key={unit.identifier}
            open={isExpanded}
            onOpenChange={() => toggleMainUnit(unit.identifier)}
          >
            <div
              className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                contentBlocked ? "bg-gray-100 border-gray-200" : "bg-white border-gray-100"
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
                      {unit.name ?? t('collectionSidebar.untitled')}
                    </h3>
                    {(unit.primaryCategory ?? unit.description) && (
                      <p
                        className={`text-sm ${
                          contentBlocked ? "text-gray-400" : "text-muted-foreground"
                        }`}
                      >
                        {unit.primaryCategory ?? unit.description}
                      </p>
                    )}
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
                <div className="p-3 pt-0">
                  <ExpandedUnitContent
                    nodes={unit.children ?? []}
                    collectionId={collectionId}
                    batchId={batchId}
                    contentBlocked={contentBlocked}
                    activeContentId={activeContentId}
                    contentStatusMap={contentStatusMap}
                    t={t}
                  />
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
