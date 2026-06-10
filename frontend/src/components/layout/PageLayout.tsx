import { ReactNode, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import HomeSidebar from '@/components/home/HomeSidebar';
import TopNavBar from '@/components/layout/TopNavBar';
import BottomNavBar from '@/components/layout/BottomNavBar';
import { Sheet, SheetContent, SheetTitle } from '@/components/home/Sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppI18n } from '@/hooks/useAppI18n';
import { useSidebarState } from '@/hooks/useSidebarState';
import { useTheme } from '@/providers/ThemeProvider';
import { usePermissions } from '@/hooks/usePermission';

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

interface PageLayoutProps {
  children?: ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps = {}) => {
  const { t } = useAppI18n();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { activeLayout } = useTheme();
  const { isAuthenticated } = usePermissions();

  const isExplorePage = location.pathname.startsWith('/explore');
  const defaultState = isExplorePage ? false : !isMobile;
  const { isOpen: isSidebarOpen, toggleSidebar, setSidebarOpen } = useSidebarState(defaultState);

  // Close sidebar when navigating TO Explore page
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    const prevPath = prevPathRef.current;
    const currentPath = location.pathname;
    const justNavigatedToExplore =
      currentPath.startsWith('/explore') && !prevPath.startsWith('/explore');
    if (justNavigatedToExplore) {
      setSidebarOpen(false, false);
    }
    prevPathRef.current = currentPath;
  }, [location.pathname, setSidebarOpen]);

  // Close sidebar on mobile transition
  const prevIsMobileRef = useRef(isMobile);
  useEffect(() => {
    const wasDesktop = !prevIsMobileRef.current;
    const isNowMobile = isMobile;
    if (wasDesktop && isNowMobile) {
      setSidebarOpen(false, false);
    }
    prevIsMobileRef.current = isMobile;
  }, [isMobile, setSidebarOpen]);

  const activeNav = getActiveNav(location.pathname);
  const layoutId = activeLayout.id;

  // ---- ANONYMOUS: minimal layout, skip Top/Bottom nav and sidebar ----
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header isSidebarOpen={false} onToggleSidebar={() => {}} forcePublic />
        <div className="flex flex-1 relative">
          {children ?? <Outlet />}
        </div>
        <Footer />
      </div>
    );
  }

  // ---- MOBILE: all layouts collapse to drawer ----
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setSidebarOpen(true, true)} />
        <Sheet open={isSidebarOpen} onOpenChange={(open) => setSidebarOpen(open, true)}>
          <SheetContent side="left" className="w-[17.5rem] px-0">
            <SheetTitle className="sr-only">{t('navigationMenu')}</SheetTitle>
            <HomeSidebar
              activeNav={activeNav}
              onNavChange={() => setSidebarOpen(false, true)}
            />
          </SheetContent>
        </Sheet>
        <div className="flex-1 flex">
          {children ?? <Outlet />}
        </div>
        {layoutId === 'bottom' && <BottomNavBar activeNav={activeNav} />}
        <Footer />
      </div>
    );
  }

  // ---- DESKTOP: TOP layout ----
  if (layoutId === 'top') {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header isSidebarOpen={false} onToggleSidebar={() => {}} />
        <TopNavBar activeNav={activeNav} />
        <div className="flex flex-1 relative">
          {children ?? <Outlet />}
        </div>
        <Footer />
      </div>
    );
  }

  // ---- DESKTOP: BOTTOM layout ----
  if (layoutId === 'bottom') {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header isSidebarOpen={false} onToggleSidebar={() => {}} />
        <div className="flex flex-1 relative">
          {children ?? <Outlet />}
        </div>
        <BottomNavBar activeNav={activeNav} />
        <Footer />
      </div>
    );
  }

  // ---- DESKTOP: SIDEBAR layouts (left = default, right = mirrored) ----
  const isRight = layoutId === 'sidebar-right';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setSidebarOpen(true, true)} />

      <div className={`flex flex-1 relative transition-all${isRight ? ' flex-row-reverse' : ''}`}>
        <div className="relative shrink-0 sticky top-[4.5rem] self-start z-20">
          <HomeSidebar
            activeNav={activeNav}
            onNavChange={() => {}}
            collapsed={!isSidebarOpen}
            onToggle={toggleSidebar}
          />
        </div>

        {children ?? <Outlet />}
      </div>

      <Footer />
    </div>
  );
};

export default PageLayout;
