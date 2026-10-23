import { FiGrid, FiList, FiChevronDown } from "react-icons/fi";
import { LuSparkles } from "react-icons/lu";
import { Button } from "@/components/common/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/common/DropdownMenu";
import { cn } from "@/lib/utils";
import { useAppI18n } from "@/hooks/useAppI18n";
import type { ViewMode, ContentTypeFilter } from "@/types/workspaceTypes";

interface WorkspaceContentFiltersProps {
  isBookCreatorOnly?: boolean;
  isBookReviewerOnly?: boolean;
  typeFilter: ContentTypeFilter;
  onTypeFilterChange: (filter: ContentTypeFilter) => void;
  enrichmentFilter: string[];
  onEnrichmentFilterChange: (on: boolean) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

/** The "All Types" / AI-enhanced / grid-list toggle row shown next to the
 *  search bar whenever content is visible - split out of WorkspaceToolbar to
 *  keep that file under the project's max-lines limit. */
const WorkspaceContentFilters = ({
  isBookCreatorOnly = false,
  isBookReviewerOnly = false,
  typeFilter,
  onTypeFilterChange,
  enrichmentFilter,
  onEnrichmentFilterChange,
  viewMode,
  onViewModeChange,
}: WorkspaceContentFiltersProps) => {
  const { t } = useAppI18n();
  const enrichmentActive = enrichmentFilter.length > 0;

  return (
    <>
      {/* Type Filter - hidden for book-only creators/reviewers who always see Digital Textbook */}
      {!isBookCreatorOnly && !isBookReviewerOnly && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="font-rubik rounded-xl flex-shrink-0">
              {t(`workspace.typeFilters.${typeFilter}`)}
              <FiChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            {(['all', 'course', 'content', 'quiz', 'collection'] as ContentTypeFilter[]).map((type) => (
              <DropdownMenuItem
                key={type}
                onClick={() => onTypeFilterChange(type)}
                className="font-rubik"
              >
                {t(`workspace.typeFilters.${type}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* AI-enhanced filter - one toggle for every registered enrichment type; server-side, via `enrichmentTypes` in the search filters */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEnrichmentFilterChange(!enrichmentActive)}
        aria-pressed={enrichmentActive}
        aria-label={t('workspace.aiEnhancedFilter')}
        title={t('workspace.aiEnhancedFilter')}
        className={cn(
          "rounded-xl flex-shrink-0 px-2.5",
          enrichmentActive && "bg-sunbird-theme-accent-muted/20 border-sunbird-theme-accent text-sunbird-theme-accent"
        )}
      >
        <LuSparkles className="w-4 h-4" aria-hidden="true" />
      </Button>

      {/* View Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
        <button
          onClick={() => onViewModeChange('grid')}
          aria-label={t('workspace.gridView')}
          className={cn(
            "p-2 rounded-md transition-colors",
            viewMode === 'grid' ? "bg-white text-sunbird-theme-accent shadow-sm" : "text-muted-foreground"
          )}
        >
          <FiGrid className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          aria-label={t('workspace.listView')}
          className={cn(
            "p-2 rounded-md transition-colors",
            viewMode === 'list' ? "bg-white text-sunbird-theme-accent shadow-sm" : "text-muted-foreground"
          )}
        >
          <FiList className="w-4 h-4" />
        </button>
      </div>
    </>
  );
};

export default WorkspaceContentFilters;
