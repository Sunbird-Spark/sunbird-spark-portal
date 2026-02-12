import { FiMoreVertical, FiEdit, FiTrash2, FiEye, FiSend, FiClock, FiUser } from "react-icons/fi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/common/DropdownMenu";
import { Button } from "@/components/common/Button";
import { cn, formatTimeAgo } from "@/lib/utils";
import { type WorkspaceItem } from "@/types/workspaceTypes";
import { CONTENT_TYPE_ICONS, CONTENT_TYPE_CARD_COLORS, STATUS_CONFIG } from "@/services/workspace";

interface WorkspaceContentCardProps {
  item: WorkspaceItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onSubmitReview: (id: string) => void;
}

const WorkspaceContentCard = ({
  item,
  onEdit,
  onDelete,
  onView,
  onSubmitReview,
}: WorkspaceContentCardProps) => {
  const TypeIcon = CONTENT_TYPE_ICONS[item.type];
  const colors = CONTENT_TYPE_CARD_COLORS[item.type];
  const status = STATUS_CONFIG[item.status];
  const timeAgo = item.updatedAt ? formatTimeAgo(new Date(item.updatedAt)) : '—';

  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 border border-border">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={cn("w-full h-full flex items-center justify-center", colors.bg)}>
            <TypeIcon className={cn("w-12 h-12", colors.text, "opacity-40")} />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-rubik", status.bg, status.text)}>
            {status.dot ? <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} /> : null}
            {status.label}
          </div>
        </div>

        {/* Type Badge */}
        <div className="absolute top-3 right-3">
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-rubik bg-surface/90 backdrop-blur-sm shadow-sm", colors.text)}>
            <TypeIcon className="w-3 h-3" />
            <span className="capitalize">{item.type}</span>
          </div>
        </div>

        {/* Hover Actions Overlay */}
        <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onView(item.id)}
            className="bg-surface hover:bg-muted text-foreground rounded-lg shadow-md"
          >
            <FiEye className="w-4 h-4 mr-1.5" />
            Preview
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onEdit(item.id)}
            className="bg-surface hover:bg-muted text-foreground rounded-lg shadow-md"
          >
            <FiEdit className="w-4 h-4 mr-1.5" />
            Edit
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground text-sm font-rubik line-clamp-2 leading-snug flex-1">
            {item.title}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground">
                <FiMoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-card rounded-xl shadow-lg border border-border">
              <DropdownMenuItem onClick={() => onView(item.id)} className="font-rubik cursor-pointer gap-2">
                <FiEye className="w-4 h-4" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(item.id)} className="font-rubik cursor-pointer gap-2">
                <FiEdit className="w-4 h-4" /> Edit
              </DropdownMenuItem>
              {item.status === 'draft' && (
                <DropdownMenuItem onClick={() => onSubmitReview(item.id)} className="font-rubik cursor-pointer gap-2 text-sunbird-wave">
                  <FiSend className="w-4 h-4" /> Submit for Review
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(item.id)} className="font-rubik cursor-pointer gap-2 text-destructive focus:text-destructive">
                <FiTrash2 className="w-4 h-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
