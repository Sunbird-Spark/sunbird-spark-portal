import { FiPlus, FiFolder, FiEdit, FiSend, FiCheckCircle, FiUpload, FiUsers, FiEye, FiClipboard } from "react-icons/fi";
import { Badge } from "@/components/common/Badge";
import { cn } from "@/lib/utils";
import { useAppI18n } from "@/hooks/useAppI18n";

export type WorkspaceView = 'create' | 'all' | 'drafts' | 'review' | 'published' | 'uploads' | 'collaborations' | 'pending-review' | 'my-published';
export type UserRole = 'creator' | 'reviewer';

interface WorkspaceSidebarProps {
  activeView: WorkspaceView;
  onViewChange: (view: WorkspaceView) => void;
  counts: { drafts: number; review: number; published: number; all: number; pendingReview?: number };
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const WorkspaceSidebar = ({ activeView, onViewChange, counts, userRole, onRoleChange }: WorkspaceSidebarProps) => {
  const { t } = useAppI18n();

  const creatorMenuItems = [
    { id: 'create' as const, label: t('createNew'), icon: FiPlus, highlight: true },
    { id: 'all' as const, label: t('allMyContent'), icon: FiFolder, count: counts.all },
    { id: 'drafts' as const, label: t('drafts'), icon: FiEdit, count: counts.drafts },
    { id: 'review' as const, label: t('submittedForReview'), icon: FiSend, count: counts.review },
    { id: 'published' as const, label: t('published'), icon: FiCheckCircle, count: counts.published },
    { id: 'uploads' as const, label: t('allUploads'), icon: FiUpload },
    { id: 'collaborations' as const, label: t('collaborations'), icon: FiUsers },
  ];

  const reviewerMenuItems = [
    { id: 'pending-review' as const, label: 'Pending Review', icon: FiClipboard, count: counts.pendingReview ?? 0 },
    { id: 'my-published' as const, label: 'Published by Me', icon: FiCheckCircle, count: counts.published },
  ];

  const menuItems = userRole === 'creator' ? creatorMenuItems : reviewerMenuItems;

  return (
    <div className="space-y-5">
      {/* Role Toggle */}
      <div className="p-1 bg-gray-100 rounded-xl">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => onRoleChange('creator')}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium font-['Rubik'] transition-all duration-200",
              userRole === 'creator'
                ? "bg-white text-sunbird-brick shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FiEdit className="w-4 h-4" />
            <span>Creator</span>
          </button>
          <button
            onClick={() => onRoleChange('reviewer')}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium font-['Rubik'] transition-all duration-200",
              userRole === 'reviewer'
                ? "bg-white text-sunbird-brick shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FiEye className="w-4 h-4" />
            <span>Reviewer</span>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200" />

      {/* Navigation Menu */}
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const isHighlight = 'highlight' in item && item.highlight;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium font-['Rubik'] transition-all duration-200",
                isActive && !isHighlight && "bg-sunbird-ginger/10 text-sunbird-brick",
                !isActive && !isHighlight && "text-foreground/80 hover:bg-gray-100 hover:text-foreground",
                isHighlight && isActive && "bg-sunbird-brick text-white shadow-md hover:bg-sunbird-brick/90",
                isHighlight && !isActive && "bg-sunbird-brick text-white hover:bg-sunbird-brick/90 shadow-sm"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {'count' in item && item.count !== undefined && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "min-w-[24px] justify-center text-xs font-medium",
                    isActive && !isHighlight && "bg-sunbird-ginger/20 text-sunbird-brick border-transparent",
                    !isActive && !isHighlight && "bg-gray-100 text-muted-foreground border-transparent",
                    isHighlight && "bg-white/20 text-white border-transparent"
                  )}
                >
                  {item.count}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Stats for Creator */}
      {userRole === 'creator' && (
        <>
          <div className="h-px bg-gray-200" />
          <div className="px-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 font-['Rubik']">
              Quick Stats
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-sunbird-wave/10 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-sunbird-ink font-['Rubik']">{counts.published}</div>
                <div className="text-[10px] text-muted-foreground font-['Rubik']">Published</div>
              </div>
              <div className="bg-sunbird-ginger/10 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-sunbird-brick font-['Rubik']">{counts.review}</div>
                <div className="text-[10px] text-muted-foreground font-['Rubik']">In Review</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkspaceSidebar;