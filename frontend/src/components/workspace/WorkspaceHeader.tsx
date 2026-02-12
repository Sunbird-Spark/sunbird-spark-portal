import { FiSearch, FiGrid, FiList, FiFilter, FiChevronDown } from 'react-icons/fi';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';
import { cn } from '@/lib/utils';
import { useAppI18n } from '@/hooks/useAppI18n';

export type ViewMode = 'grid' | 'list';
export type SortOption = 'updated' | 'created' | 'title';
export type ContentTypeFilter = 'all' | 'course' | 'content' | 'quiz' | 'collection';

interface WorkspaceHeaderProps {
  title: string;
  subtitle?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  typeFilter: ContentTypeFilter;
  onTypeFilterChange: (type: ContentTypeFilter) => void;
  showFilters?: boolean;
  contentCount?: number;
}

const WorkspaceHeader = ({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  typeFilter,
  onTypeFilterChange,
  showFilters = true,
  contentCount,
}: WorkspaceHeaderProps) => {
  const { t } = useAppI18n();

  const sortLabels: Record<SortOption, string> = {
    updated: t('lastUpdated'),
    created: t('dateCreated'),
    title: t('titleAZ'),
  };

  const typeLabels: Record<ContentTypeFilter, string> = {
    all: t('allTypes'),
    course: t('course'),
    content: t('content'),
    quiz: t('quiz'),
    collection: t('collection'),
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground font-rubik">
            {title}
            {contentCount !== undefined && contentCount > 0 && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({contentCount})
              </span>
            )}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground font-rubik mt-0.5">{subtitle}</p>
          )}
        </div>

        {showFilters && (
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 rounded-md transition-all',
                  viewMode === 'grid' && 'bg-white shadow-sm text-sunbird-brick',
                )}
                onClick={() => onViewModeChange('grid')}
              >
                <FiGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 rounded-md transition-all',
                  viewMode === 'list' && 'bg-white shadow-sm text-sunbird-brick',
                )}
                onClick={() => onViewModeChange('list')}
              >
                <FiList className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Filters Row */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search your content..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="ps-10 bg-white border-sunbird-gray-d0 focus:border-sunbird-ginger focus:ring-sunbird-ginger/20 rounded-xl h-10 font-rubik text-sm"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 px-4 bg-white border-sunbird-gray-d0 rounded-xl font-rubik text-sm gap-2 hover:border-sunbird-ginger hover:bg-sunbird-ginger/5"
                >
                  <FiFilter className="w-4 h-4 text-muted-foreground" />
                  <span className={typeFilter !== 'all' ? 'text-sunbird-brick font-medium' : ''}>
                    {typeLabels[typeFilter]}
                  </span>
                  <FiChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-44 bg-white rounded-xl shadow-lg border border-gray-100"
              >
                {Object.entries(typeLabels).map(([key, label]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => onTypeFilterChange(key as ContentTypeFilter)}
                    className={cn(
                      'font-rubik cursor-pointer',
                      typeFilter === key && 'bg-sunbird-ginger/10 text-sunbird-brick',
                    )}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 px-4 bg-white border-sunbird-gray-d0 rounded-xl font-rubik text-sm gap-2 hover:border-sunbird-ginger hover:bg-sunbird-ginger/5"
                >
                  <span>{sortLabels[sortBy]}</span>
                  <FiChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40 bg-white rounded-xl shadow-lg border border-gray-100"
              >
                {Object.entries(sortLabels).map(([key, label]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => onSortChange(key as SortOption)}
                    className={cn(
                      'font-rubik cursor-pointer',
                      sortBy === key && 'bg-sunbird-ginger/10 text-sunbird-brick',
                    )}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceHeader;
