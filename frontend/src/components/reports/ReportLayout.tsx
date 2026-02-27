import { useState, type ReactNode } from "react";
import Header from "@/components/home/Header";
import HomeSidebar from "@/components/home/HomeSidebar";
import Footer from "@/components/home/Footer";
import { Sheet, SheetContent, SheetTitle } from "@/components/home/Sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebarState } from "@/hooks/useSidebarState";
import "../../pages/workspace/workspace.css";

interface ReportLayoutProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  children: ReactNode;
  actions?: ReactNode;
  activeNav?: string;
}

const ReportLayout = ({ title, breadcrumbs, children, actions, activeNav = "admin-reports" }: ReportLayoutProps) => {
  const isMobile = useIsMobile();
  const [currentNav, setCurrentNav] = useState(activeNav);
  const { isOpen: isSidebarOpen, setSidebarOpen: setIsSidebarOpen } = useSidebarState(!isMobile);

  return (
    <div className="workspace-container">
      <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(true)} />

      <div className="flex flex-1 relative transition-all">
        {isMobile ? (
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="w-[17.5rem] pt-10 px-0 pb-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <HomeSidebar
                activeNav={currentNav}
                onNavChange={(nav) => { setCurrentNav(nav); setIsSidebarOpen(false); }}
              />
            </SheetContent>
          </Sheet>
        ) : (
          <div className="relative shrink-0 sticky top-[4.5rem] self-start z-20">
            <HomeSidebar
              activeNav={currentNav}
              onNavChange={setCurrentNav}
              collapsed={!isSidebarOpen}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <main className="workspace-main-content">
            <div className="workspace-content-wrapper">
              {/* Breadcrumbs */}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
                  {breadcrumbs.map((crumb, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      {i > 0 && <span>/</span>}
                      {crumb.href ? (
                        <a href={crumb.href} className="hover:text-primary transition-colors">{crumb.label}</a>
                      ) : (
                        <span className="text-foreground font-medium">{crumb.label}</span>
                      )}
                    </span>
                  ))}
                </nav>
              )}

              {/* Page header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                {actions && <div className="flex items-center gap-3">{actions}</div>}
              </div>

              {children}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default ReportLayout;
