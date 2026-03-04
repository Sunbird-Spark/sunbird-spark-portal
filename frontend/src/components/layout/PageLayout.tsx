import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import HomeSidebar from '@/components/home/HomeSidebar';
import { Sheet, SheetContent, SheetTitle } from '@/components/home/Sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppI18n } from '@/hooks/useAppI18n';
import { useSidebarState } from '@/hooks/useSidebarState';

// Order matters: more specific prefixes must come before shorter ones
const PATH_TO_NAV: { prefix: string; navId: string }[] = [
  { prefix: '/workspace', navId: 'workspace' },
  { prefix: '/my-learning', navId: 'learning' },
  { prefix: '/explore', navId: 'explore' },
  { prefix: '/profile', navId: 'profile' },
  { prefix: '/reports/user', navId: 'user-report' },
  { prefix: '/reports/platform', navId: 'admin-reports' },
  { prefix: '/reports', navId: 'admin-reports' },
  { prefix: '/user-management', navId: 'user-management' },
  { prefix: '/help-support', navId: 'help' },
  { prefix: '/home', navId: 'home' },
];

function getActiveNav(pathname: string): string {
  for (const { prefix, navId } of PATH_TO_NAV) {
    if (pathname.startsWith(prefix)) return navId;
  }
  return 'home';
}

const PageLayout = () => {
  const { t } = useAppI18n();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Determine default state based on page and mobile status
  const isExplorePage = location.pathname.startsWith('/explore');
  const defaultState = isExplorePage ? false : !isMobile;
  
  const { isOpen: isSidebarOpen, toggleSidebar, setSidebarOpen } = useSidebarState(defaultState);

  // Always close sidebar when navigating to Explore page
  useEffect(() => {
    if (isExplorePage) {
      setSidebarOpen(false, false);
    }
  }, [isExplorePage, setSidebarOpen]);

  // Handle mobile state changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false, false);
    }
  }, [isMobile, setSidebarOpen]);

  const activeNav = getActiveNav(location.pathname);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setSidebarOpen(true, true)} />

      <div className="flex flex-1 relative transition-all">
        {isMobile ? (
          <Sheet open={isSidebarOpen} onOpenChange={(open) => setSidebarOpen(open, true)}>
            <SheetContent side="left" className="w-[17.5rem] pt-10 px-0 pb-0">
              <SheetTitle className="sr-only">{t('navigationMenu')}</SheetTitle>
              <HomeSidebar
                activeNav={activeNav}
                onNavChange={() => setSidebarOpen(false, true)}
              />
            </SheetContent>
          </Sheet>
        ) : (
          <div className="relative shrink-0 sticky top-[4.5rem] self-start z-20">
            <HomeSidebar
              activeNav={activeNav}
              onNavChange={() => {}}
              collapsed={!isSidebarOpen}
              onToggle={toggleSidebar}
            />
          </div>
        )}

        <Outlet />
      </div>

      <Footer />
    </div>
  );
};

export default PageLayout;
