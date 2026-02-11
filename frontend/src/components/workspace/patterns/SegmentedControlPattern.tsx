import { FiPlus, FiGrid, FiList, FiChevronDown } from "react-icons/fi";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/common/DropdownMenu";
import { cn } from "@/lib/utils";
import { useAppI18n } from "@/hooks/useAppI18n";
import { type WorkspaceView, type UserRole } from "../WorkspaceSidebar";
import { type ViewMode, type SortOption, type ContentTypeFilter } from "../WorkspaceHeader";

interface SegmentedControlPatternProps {
  activeView: WorkspaceView;
  onViewChange: (view: WorkspaceView) => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  counts: { drafts: number; review: number; published: number; all: number; pendingReview?: number };
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  typeFilter: ContentTypeFilter;
  onTypeFilterChange: (filter: ContentTypeFilter) => void;
  contentCount?: number;
  onCreateClick: () => void;
}

const SegmentedControlPattern = ({
  activeView,
  onViewChange,
  userRole,
  onRoleChange,
  counts,
  viewMode,
  onViewModeChange,
  sortBy: _sortBy,
  onSortChange: _onSortChange,
  typeFilter,
  onTypeFilterChange,
  contentCount,
  onCreateClick,
}: SegmentedControlPatternProps) => {
  const { t } = useAppI18n();

  const creatorSegments = [
    { id: 'all' as const, label: 'All', count: counts.all },
    { id: 'drafts' as const, label: 'Drafts', count: counts.drafts },
    { id: 'review' as const, label: 'Review', count: counts.review },
    { id: 'published' as const, label: 'Published', count: counts.published },
  ];

  const reviewerSegments = [
    { id: 'pending-review' as const, label: 'Pending', count: counts.pendingReview || 3 },
    { id: 'my-published' as const, label: 'Published', count: counts.published },
  ];

  const segments = userRole === 'creator' ? creatorSegments : reviewerSegments;
  const showContentFilters = !['create', 'uploads', 'collaborations'].includes(activeView);

  const secondaryActions = userRole === 'creator' ? [
    { id: 'uploads' as const, label: 'Uploads' },
    { id: 'collaborations' as const, label: 'Collaborations' },
  ] : [];

  return (
    <div className="space-y-4 mb-6">
      {/* Top Bar: Role + Create + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Role Switcher - Minimal */}
          <div className="flex items-center gap-1 text-sm font-['Rubik']">
            <button
              onClick={() => onRoleChange('creator')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all",
                userRole === 'creator'
                  ? "text-sunbird-brick font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Creator
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => onRoleChange('reviewer')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all",
                userRole === 'reviewer'
                  ? "text-sunbird-wave font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Reviewer
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:ml-auto">
          {userRole === 'creator' && (
            <Button
              onClick={onCreateClick}
              size="lg"
              className="bg-sunbird-brick hover:bg-sunbird-brick/90 text-white font-['Rubik'] rounded-2xl shadow-lg px-6"
            >
              <FiPlus className="w-5 h-5 mr-2" />
              {t('createNew')}
            </Button>
          )}
        </div>
      </div>

      {/* Segmented Control Bar */}
      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100/80 p-2">
        <div className="flex items-center justify-between">
          {/* Main Segments */}
          <div className="flex bg-gray-100 rounded-xl p-1 flex-1 max-w-xl">
            {segments.map((segment) => (
              <button
                key={segment.id}
                onClick={() => onViewChange(segment.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium font-['Rubik'] transition-all",
                  activeView === segment.id
                    ? "bg-white text-sunbird-brick shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{segment.label}</span>
                {segment.count !== undefined && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "min-w-[20px] justify-center text-xs",
                      activeView === segment.id
                        ? "bg-sunbird-ginger/20 text-sunbird-brick border-transparent"
                        : "bg-gray-200/70 text-muted-foreground border-transparent"
                    )}
                  >
                    {segment.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Secondary Actions + Filters */}
          <div className="flex items-center gap-3 ml-4">
            {/* Secondary Dropdown */}
            {secondaryActions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="font-['Rubik'] rounded-xl">
                    More
                    <FiChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  {secondaryActions.map((action) => (
                    <DropdownMenuItem
                      key={action.id}
                      onClick={() => onViewChange(action.id)}
                      className="font-['Rubik']"
                    >
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Filters + View Mode (show when content is visible) */}
            {showContentFilters && (
              <>
                {/* Type Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="font-['Rubik'] rounded-xl">
                      {typeFilter === 'all' ? 'All Types' : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
                      <FiChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    {(['all', 'course', 'content', 'quiz', 'collection'] as ContentTypeFilter[]).map((type) => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => onTypeFilterChange(type)}
                        className="font-['Rubik']"
                      >
                        {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* View Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => onViewModeChange('grid')}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      viewMode === 'grid' ? "bg-white text-sunbird-brick shadow-sm" : "text-muted-foreground"
                    )}
                  >
                    <FiGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onViewModeChange('list')}
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      viewMode === 'list' ? "bg-white text-sunbird-brick shadow-sm" : "text-muted-foreground"
                    )}
                  >
                    <FiList className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row - Quick glance */}
      {userRole === 'creator' && showContentFilters && (
        <div className="flex items-center gap-6 px-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sunbird-moss" />
            <span className="text-sm font-['Rubik'] text-muted-foreground">
              <span className="font-semibold text-foreground">{counts.published}</span> Published
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sunbird-ginger" />
            <span className="text-sm font-['Rubik'] text-muted-foreground">
              <span className="font-semibold text-foreground">{counts.review}</span> In Review
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-sm font-['Rubik'] text-muted-foreground">
              <span className="font-semibold text-foreground">{counts.drafts}</span> Drafts
            </span>
          </div>
          {contentCount !== undefined && (
            <span className="text-sm text-muted-foreground font-['Rubik'] ml-auto">
              Showing {contentCount} items
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SegmentedControlPattern;
