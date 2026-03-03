import { FiMoreVertical, FiEdit, FiTrash2, FiEye, FiClock, FiUser, FiLock } from "react-icons/fi";
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
  CONTENT_TYPE_CARD_COLORS,
  getStatusConfig,
  getWorkspaceItemActionVisibility,
  getPrimaryCategoryIcon,
} from "@/services/workspace";
import CardThumbnailBackground from "./CardThumbnailBackground";
import { useAppI18n } from "@/hooks/useAppI18n";

interface WorkspaceContentCardProps {
  item: WorkspaceItem;
  userRole?: UserRole;
  lockInfo?: { creatorName: string };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

const WorkspaceContentCard = ({
  item,
  userRole,
  lockInfo,
  onEdit,
  onDelete,
  onView,
}: WorkspaceContentCardProps) => {
  const { t } = useAppI18n();
  const TypeIcon = getPrimaryCategoryIcon(item.primaryCategory, item.type);
  const colors = CONTENT_TYPE_CARD_COLORS[item.type];
  const statusConfig = getStatusConfig(t);
  const status = statusConfig[item.status];
  const timeAgo = item.updatedAt ? formatTimeAgo(new Date(item.updatedAt)) : '—';

  const { showView, showEdit: canEdit, showDelete } = getWorkspaceItemActionVisibility(item.status, userRole);
  const isLocked = !!lockInfo;

  return (
    <div className="bg-card rounded-2xl shadow-sm group hover:shadow-md transition-all duration-300 border border-border">
      {/* Thumbnail wrapper — no overflow-hidden so the lock tooltip can escape */}
      <div className="relative aspect-video rounded-t-2xl">
        {/* Image container — overflow-hidden here to clip the hover zoom */}
        <div className="absolute inset-0 bg-muted overflow-hidden rounded-t-2xl">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <CardThumbnailBackground type={item.type} primaryCategory={item.primaryCategory} />
          )}

          {/* Hover Actions Overlay — hidden when locked */}
          {!isLocked && (
            <div className="absolute inset-0 z-10 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 pointer-events-none">
              {showView && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onView(item.id)}
                  className="pointer-events-auto bg-surface hover:bg-muted text-foreground rounded-lg shadow-md"
                >
                  <FiEye className="w-4 h-4 mr-1.5" />
                  {t('workspaceCard.view')}
                </Button>
              )}
              {canEdit && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onEdit(item.id)}
                  className="pointer-events-auto bg-surface hover:bg-muted text-foreground rounded-lg shadow-md"
                >
                  <FiEdit className="w-4 h-4 mr-1.5" />
                  {t('workspaceCard.edit')}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-20">
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-rubik", status.bg, status.text)}>
            {status.dot ? <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} /> : null}
            {status.label}
          </div>
        </div>

        {/* Type Badge */}
        <div className="absolute top-3 right-3 z-20">
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-rubik bg-surface/90 backdrop-blur-sm shadow-sm", colors.text)}>
            <TypeIcon className="w-3 h-3" />
            <span>{item.primaryCategory || item.type}</span>
          </div>
        </div>

        {/* Lock Badge — outside overflow-hidden so tooltip is not clipped */}
        {isLocked && (
          <div className="absolute bottom-3 left-3 z-20 group/lock cursor-pointer">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-rubik bg-amber-100 text-amber-700">
              <FiLock className="w-3 h-3" />
              <span>{t('workspaceCard.locked')}</span>
            </div>
            <span className="absolute top-full left-0 mt-1.5 hidden group-hover/lock:block whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background shadow-md z-50">
              {t('workspaceCard.lockedBy', { name: lockInfo.creatorName })}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground text-sm font-rubik line-clamp-2 leading-snug flex-1">
            {item.title}
          </h3>
          {!isLocked && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground">
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
          )}
        </div>

        <p className="text-xs text-muted-foreground font-rubik line-clamp-2 mb-3 leading-relaxed">
          {item.description}
        </p>

        {/* Meta Info */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-rubik">
          <div className="flex items-center gap-1">
            <FiClock className="w-3 h-3" />
            <span>{timeAgo}</span>
          </div>
          <div className="flex items-center gap-1">
            <FiUser className="w-3 h-3" />
            <span>{item.author}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceContentCard;
