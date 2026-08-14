import { FiChevronDown, FiSearch } from 'react-icons/fi';
import { useAppI18n } from '@/hooks/useAppI18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/DropdownMenu';

export type SkillsView = 'skills' | 'paths';

interface MySkillsControlsProps {
  view: SkillsView;
  onViewChange: (view: SkillsView) => void;
  query: string;
  onQueryChange: (query: string) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
  /** Filter options for the active view, in display order. */
  filterOptions: { value: string; label: string }[];
  resultLabel: string;
}

/** View switch, search and a view-appropriate status narrow, on one row. */
export function MySkillsControls({
  view,
  onViewChange,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  filterOptions,
  resultLabel,
}: MySkillsControlsProps) {
  const { t } = useAppI18n();
  const activeLabel = filterOptions.find((o) => o.value === filter)?.label ?? '';

  const tabClass = (isActive: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
      isActive ? 'bg-white text-sunbird-brick shadow-sunbird-sm' : 'text-sunbird-gray-75 hover:text-foreground'
    }`;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-sunbird-ivory p-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'skills'}
            onClick={() => onViewChange('skills')}
            className={tabClass(view === 'skills')}
          >
            {t('mySkills.viewBySkill')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'paths'}
            onClick={() => onViewChange('paths')}
            className={tabClass(view === 'paths')}
          >
            {t('mySkills.viewByPath')}
          </button>
        </div>
        <span className="hidden text-xs text-sunbird-gray-75 sm:inline">{resultLabel}</span>
      </div>

      <div className="flex flex-1 items-center gap-3 lg:max-w-xl lg:justify-end">
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sunbird-gray-75" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t('mySkills.searchPlaceholder')}
            aria-label={t('mySkills.searchPlaceholder')}
            className="w-full rounded-md border border-sunbird-gray-e5 bg-white py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-sunbird-gray-75 focus:border-sunbird-brick focus:outline-none"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex min-w-[8rem] shrink-0 items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-normal text-foreground transition-colors hover:bg-gray-50"
              aria-label={t('mySkills.filterLabel')}
            >
              <span>{activeLabel}</span>
              <FiChevronDown className="h-4 w-4 text-sunbird-theme-accent" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50 w-[9.5rem] bg-white">
            {filterOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                className="cursor-pointer hover:bg-sunbird-theme-accent-muted/10 hover:text-sunbird-theme-accent-muted"
                onClick={() => onFilterChange(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
