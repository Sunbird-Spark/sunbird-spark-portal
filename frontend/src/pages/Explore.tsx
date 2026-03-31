import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import ExploreFilters from '../components/explore/ExploreFilters';
import ExploreGrid from '../components/explore/ExploreGrid';
import { FiChevronDown, FiSearch } from 'react-icons/fi';
import { Input } from '../components/common/Input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/common/DropdownMenu';
import { useAppI18n } from '../hooks/useAppI18n';
import useDebounce from '../hooks/useDebounce';
import { useSearchParams } from 'react-router-dom';
import { useFormRead } from '../hooks/useForm';
import useImpression from '../hooks/useImpression';
import useInteract from '../hooks/useInteract';

// Keys are the API `code` field (e.g. "primaryCategory", "mimeType"), values are selected option values
export type FilterState = Record<string, string[]>;

const SORT_OPTIONS = [
  { key: 'newest', label: 'sortOptions.newest', value: { lastUpdatedOn: 'desc' } },
  { key: 'oldest', label: 'sortOptions.oldest', value: { lastUpdatedOn: 'asc' } },
];

const Explore = () => {
  const { t } = useAppI18n();
  useImpression({ type: 'view', pageid: 'explore', env: 'explore' });
  const [searchParams, setSearchParams] = useSearchParams();
  const { interact } = useInteract();

  // Initialize filters from URL on mount — every param except 'q' is treated as a filter code.
  // e.g. ?primaryCategory=Course&primaryCategory=Content+Playlist&mimeType=video%2Fmp4
  const [filters, setFilters] = useState<FilterState>(() => {
    const initial: FilterState = {};
    searchParams.forEach((value, key) => {
      if (key === 'q') return;
      if (!initial[key]) initial[key] = [];
      initial[key].push(value);
    });
    return initial;
  });

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');
  const debouncedSearchQuery = useDebounce(searchQuery, 600);
  const [sortBy, setSortBy] = useState<any>({ lastUpdatedOn: 'desc' });
  const [sortLabelKey, setSortLabelKey] = useState('newest');

  const handleFilterChange: Dispatch<SetStateAction<FilterState>> = (value) => {
    const resolved = typeof value === 'function' ? value(filters) : value;
    interact({
      id: 'explore-filter-change',
      type: 'CLICK',
      pageid: 'explore-page',
      cdata: Object.keys(resolved).map((k) => ({ id: k, type: 'Filter' })),
    });
    setFilters(value);
  };

  // Same query key as ExploreFilters — React Query returns cached data, no extra API call.
  // Used here only to control whether the aside is rendered (scenario 3: hide layout when empty/errored)
  const { data: formData, isLoading: isFiltersLoading, isError: isFiltersError } = useFormRead({
    request: { type: 'portal', subType: 'explorepage', action: 'filters', component: 'portal' },
  });
  const rawGroups = (formData?.data as any)?.form?.data?.filters;
  const showFilters = isFiltersLoading || (!isFiltersError && Array.isArray(rawGroups) && rawGroups.length > 0);

  // Sync search state when navigating here from the search modal
  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setSearchQuery(q);
  }, [searchParams]);

  // Keep a ref to setSearchParams so the effect below doesn't re-fire when
  // React Router recreates setSearchParams after every navigation (it closes
  // over the latest `searchParams` in its useCallback deps).
  const setSearchParamsRef = useRef(setSearchParams);
  useEffect(() => {
    setSearchParamsRef.current = setSearchParams;
  }, [setSearchParams]);

  const hasInitiallyMounted = useRef(false);
  useEffect(() => {
    if (!hasInitiallyMounted.current) {
      hasInitiallyMounted.current = true;
      return;
    }
    const next = new URLSearchParams();
    if (debouncedSearchQuery) {
      next.set('q', debouncedSearchQuery);
      interact({
        id: 'explore-search',
        type: 'search',
        pageid: 'explore-page',
        cdata: [{ type: 'Query', id: debouncedSearchQuery }],
      });
    }
    Object.entries(filters).forEach(([code, values]) => {
      values.forEach((value) => next.append(code, value));
    });
    setSearchParamsRef.current(next, { replace: true });
  }, [filters, debouncedSearchQuery]);

  return (
    <main className="flex-1 bg-white relative md:h-[calc(100vh-4.5rem)] overflow-hidden">
      <div className="w-full h-full px-[1.875rem] py-6 md:py-8 flex flex-col">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-1 overflow-hidden">
          {/* Filters Sidebar — sticky and separate */}
          {showFilters && (
            <aside className="w-full md:w-auto md:min-w-[18rem] shrink-0 overflow-y-auto">
              <ExploreFilters filters={filters} setFilters={handleFilterChange} />
            </aside>
          )}

          {/* Content Grid */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {/* Search Bar Container */}
            <div className="shrink-0 mb-6">
              <div className="bg-white rounded-[0.75rem] px-4 flex flex-row justify-between items-center shadow-sm border border-border h-[3.75rem]">
                <div className="flex-1 max-w-2xl relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[1rem] placeholder:text-muted-foreground w-full"
                  />
                </div>

                <div className="items-center gap-3 mt-4 md:mt-0 hidden md:flex">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="8" y1="6" x2="21" y2="6"></line>
                      <line x1="8" y1="12" x2="21" y2="12"></line>
                      <line x1="8" y1="18" x2="21" y2="18"></line>
                      <line x1="3" y1="6" x2="3.01" y2="6"></line>
                      <line x1="3" y1="12" x2="3.01" y2="12"></line>
                      <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                    <span className="text-sm font-medium">{t('sortBy')}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-normal text-foreground hover:bg-gray-50 transition-colors min-w-[120px] justify-between">
                        {t(`sortOptions.${sortLabelKey}`)}
                        <FiChevronDown className="w-4 h-4 text-sunbird-brick" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[8.75rem] bg-white z-50">
                      {SORT_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option.key}
                          className={`cursor-pointer hover:bg-gray-50 ${sortLabelKey === option.key ? 'bg-gray-50 font-medium' : ''}`}
                          data-edataid={`sort-by-${option.key}`}
                          data-pageid="explore-page"
                          onClick={() => {
                            if (sortLabelKey !== option.key) {
                              setSortBy(option.value);
                              setSortLabelKey(option.key);
                            }
                          }}
                        >
                          {t(option.label)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Scrollable Cards Container */}
            <div className="flex-1 overflow-y-auto">
              <ExploreGrid filters={filters} query={debouncedSearchQuery} sortBy={sortBy} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Explore;
