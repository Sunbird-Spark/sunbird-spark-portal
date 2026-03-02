import { type ReactNode } from "react";
import "../../pages/workspace/workspace.css";

interface ReportLayoutProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  children: ReactNode;
  actions?: ReactNode;
  activeNav?: string;
}

const ReportLayout = ({ title, breadcrumbs, children, actions }: ReportLayoutProps) => {
  return (
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
    </div>
  );
};

export default ReportLayout;
