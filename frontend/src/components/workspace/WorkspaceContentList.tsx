import { FiMoreVertical, FiEdit, FiTrash2, FiEye, FiClock, FiLock } from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/common/DropdownMenu";
import { Button } from "@/components/common/Button";
import { cn, formatTimeAgo } from "@/lib/utils";
import { type WorkspaceItem, type UserRole } from "@/types/workspaceTypes";
import {
  CONTENT_TYPE_COLORS,
  STATUS_CONFIG,
  getWorkspaceItemActionVisibility,
  getPrimaryCategoryIcon,
} from "@/services/workspace";
import { useAppI18n } from "@/hooks/useAppI18n";
import CardThumbnailBackground from "./CardThumbnailBackground";
import { getCategoryLabel } from "@/utils/i18nUtils";

interface WorkspaceContentListProps {
  items: WorkspaceItem[];
  userRole?: UserRole;
  lockedContentMap?: Record<string, { creatorName: string }>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

const WorkspaceContentList = ({
  items,
  userRole,
  lockedContentMap = {},
  onEdit,
  onDelete,
  onView,
}: WorkspaceContentListProps) => {
  const { t } = useAppI18n();
  
  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide font-rubik">
        <div className="col-span-5 sm:col-span-4">{t('workspace.tableHeaders.title')}</div>
        <div className="col-span-2 hidden sm:block">{t('workspace.tableHeaders.type')}</div>
        <div className="col-span-2">{t('workspace.tableHeaders.status')}</div>
        <div className="col-span-2 hidden md:block">{t('workspace.tableHeaders.modified')}</div>
        <div className="col-span-3 sm:col-span-2 text-right">{t('workspace.tableHeaders.actions')}</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border">
        {items.map((item) => {
          const TypeIcon = getPrimaryCategoryIcon(item.primaryCategory, item.type);
          const status = STATUS_CONFIG[item.status];
          const timeAgo = item.updatedAt ? formatTimeAgo(new Date(item.updatedAt)) : '—';
          const lockInfo = lockedContentMap[item.id];

          const { showView, showEdit: canEdit, showDelete } = getWorkspaceItemActionVisibility(item.status, userRole);
          const isLocked = !!lockInfo;
          const hasActions = showView || canEdit || showDelete;
          const categoryLabel = getCategoryLabel(item.primaryCategory, t, item.type);

          return (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-muted/30 transition-colors group"
            >
              {/* Title with thumbnail */}
              <div className="col-span-5 sm:col-span-4 flex items-center gap-3 min-w-0">
                <div className="w-12 h-9 rounded-lg bg-muted overflow-hidden shrink-0">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <CardThumbnailBackground type={item.type} primaryCategory={item.primaryCategory} iconSize="sm" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-foreground text-sm font-rubik truncate">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground font-rubik truncate sm:hidden">
                    {categoryLabel}
                  </p>
                </div>
              </div>

              {/* Type */}
              <div className="col-span-2 hidden sm:flex items-center gap-2">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", CONTENT_TYPE_COLORS[item.type])}>
                  <TypeIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm text-foreground font-rubik truncate">{categoryLabel}</span>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-medium font-rubik", status.bg, status.text)}>
                  {status.label}
                </span>
              </div>

              {/* Modified */}
              <div className="col-span-2 hidden md:flex items-center gap-1.5 text-xs text-muted-foreground font-rubik">
                <FiClock className="w-3.5 h-3.5" />
                <span>{timeAgo}</span>
              </div>

              {/* Actions */}
              <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1">
                {isLocked ? (
                  <span className="relative group/lock text-amber-600 cursor-pointer">
                    <FiLock className="w-4 h-4" />
                    <span className="absolute top-full right-0 mt-1.5 hidden group-hover/lock:block whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background shadow-md z-50">
                      {t('workspaceCard.lockedBy', { name: lockInfo.creatorName })}
                    </span>
                  </span>
                ) : hasActions ? (
                  <>
                    {showView && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-sunbird-wave opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onView(item.id)}
                      >
                        <FiEye className="w-4 h-4" />
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-sunbird-ginger opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onEdit(item.id)}
                      >
                        <FiEdit className="w-4 h-4" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <FiMoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 bg-card rounded-xl shadow-lg border border-border">
                        {showView && (
                          <DropdownMenuItem onClick={() => onView(item.id)} className="font-rubik cursor-pointer gap-2">
                            <FiEye className="w-4 h-4" /> {t('workspaceCard.view')}
                          </DropdownMenuItem>
                        )}
                        {canEdit && (
                          <DropdownMenuItem onClick={() => onEdit(item.id)} className="font-rubik cursor-pointer gap-2">
                            <FiEdit className="w-4 h-4" /> {t('workspaceCard.edit')}
                          </DropdownMenuItem>
                        )}
                        {showDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(item.id)} className="font-rubik cursor-pointer gap-2 text-destructive focus:text-destructive">
                              <FiTrash2 className="w-4 h-4" /> {t('workspaceCard.delete')}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkspaceContentList;
