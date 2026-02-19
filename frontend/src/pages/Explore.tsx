import { useState } from 'react';
import Header from '../components/home/Header';
import Footer from '../components/home/Footer';
import ExploreFilters from '../components/explore/ExploreFilters';
import ExploreGrid from '../components/explore/ExploreGrid';
import { FiChevronDown, FiSearch } from 'react-icons/fi';
import { Input } from "../components/common/Input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/common/DropdownMenu";
import { useAppI18n } from '../hooks/useAppI18n';
import HomeSidebar from '../components/home/HomeSidebar';
import { Sheet, SheetContent, SheetTitle } from '../components/home/Sheet';
import { useIsMobile } from '../hooks/use-mobile';
import { useEffect } from 'react';
import "./home/home.css";
import { useSidebarState } from '../hooks/useSidebarState';

export interface FilterState {
  collections: string[];
  contentTypes: string[];
  categories: string[];
}

const Explore = () => {
  const { t } = useAppI18n();
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<FilterState>({
    collections: [],
    contentTypes: [],
    categories: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<any>({ lastUpdatedOn: 'desc' });
  const [sortLabel, setSortLabel] = useState('Newest');
  const [activeNav, setActiveNav] = useState("explore");
  const { isOpen: isSidebarOpen, setSidebarOpen: setIsSidebarOpen } = useSidebarState(false);
  useEffect(() => {
    // For Explore page, we always want it closed by default when mounting
    setIsSidebarOpen(false);
  }, [setIsSidebarOpen]);
  return (
    <div className="home-container">
      <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(true)} />

      <div className="flex flex-1 relative transition-all">
        {/* Sidebar - Mobile */}
        {isMobile ? (
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="w-[17.5rem] pt-10 px-0 pb-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <HomeSidebar
                activeNav={activeNav}
                onNavChange={(nav) => {
                  setActiveNav(nav);
                  setIsSidebarOpen(false);
                }}
              />
            </SheetContent>
          </Sheet>
        ) : (
          /* Sidebar - Desktop */
          <div className="relative shrink-0 sticky top-[4.5rem] self-start z-20">
            <HomeSidebar
              activeNav={activeNav}
              onNavChange={setActiveNav}
              collapsed={!isSidebarOpen}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 bg-white relative">
          <div className="w-full px-[1.875rem] py-6 md:py-8 transition-all">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              {/* Filters Sidebar */}
              <aside className="w-full md:w-[21.875rem] shrink-0">
                <ExploreFilters filters={filters} setFilters={setFilters} />
              </aside>

              {/* Content Grid */}
              <div className="flex-1">
                <div>
                  <div className="bg-white rounded-[0.75rem] px-4 mb-6 flex flex-row justify-between items-center shadow-sm border border-border h-[3.75rem]">
                    <div className="flex-1 max-w-2xl relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        type="text"
                        placeholder={t('searchPlaceholder') || 'Search for courses, lessons...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setActiveSearchQuery(searchQuery);
                          }
                        }}
                        className="pl-10 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[1rem] placeholder:text-[#999999] w-full"
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
                        <span className="text-sm font-medium">Sort By</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-normal text-foreground hover:bg-gray-50 transition-colors min-w-[120px] justify-between">
                            {sortLabel}
                            <FiChevronDown className="w-4 h-4 text-sunbird-brick" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[8.75rem] bg-white z-50">
                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => {
                              setSortBy({ lastUpdatedOn: 'desc' });
                              setSortLabel('Newest');
                            }}
                          >
                            Newest
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => {
                              setSortBy({ lastUpdatedOn: 'asc' });
                              setSortLabel('Oldest');
                            }}
                          >
                            Oldest
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                <div>
                  <ExploreGrid filters={filters} query={activeSearchQuery} sortBy={sortBy} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Explore;
