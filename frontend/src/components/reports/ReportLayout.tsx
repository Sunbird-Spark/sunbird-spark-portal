import { type ReactNode } from "react";
import "../../pages/workspace/workspace.css";

interface ReportLayoutProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  children: ReactNode;
  actions?: ReactNode;
}

const ReportLayout = ({ title, breadcrumbs, children, actions }: ReportLayoutProps) => {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <main className="workspace-main-content">
        <div className="workspace-content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ReportLayout;
