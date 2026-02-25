import { FiMoreVertical, FiEdit, FiTrash2, FiEye, FiClock } from "react-icons/fi";
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
import {
  CONTENT_TYPE_COLORS,
  STATUS_CONFIG,
  getWorkspaceItemActionVisibility,
  getPrimaryCategoryIcon,
} from "@/services/workspace";
import CardThumbnailBackground from "./CardThumbnailBackground";

interface WorkspaceContentListProps {
  items: WorkspaceItem[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

const WorkspaceContentList = ({
  items,
  onEdit,
  onDelete,
  onView,
}: WorkspaceContentListProps) => {
  return (
    <div className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide font-rubik">
        <div className="col-span-5 sm:col-span-4">Title</div>
        <div className="col-span-2 hidden sm:block">Type</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2 hidden md:block">Modified</div>
        <div className="col-span-3 sm:col-span-2 text-right">Actions</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border">
        {items.map((item) => {
          const TypeIcon = getPrimaryCategoryIcon(item.primaryCategory, item.type);
          const status = STATUS_CONFIG[item.status];
          const timeAgo = item.updatedAt ? formatTimeAgo(new Date(item.updatedAt)) : '—';

          const { showView, showEdit, showDelete } = getWorkspaceItemActionVisibility(item.status);

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
                    {item.primaryCategory || item.type}
                  </p>
                </div>
              </div>

              {/* Type */}
              <div className="col-span-2 hidden sm:flex items-center gap-2">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", CONTENT_TYPE_COLORS[item.type])}>
                  <TypeIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm text-foreground font-rubik">{item.primaryCategory || item.type}</span>
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
                {showEdit && (
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
                        <FiEye className="w-4 h-4" /> View
                      </DropdownMenuItem>
                    )}
                    {showEdit && (
                      <DropdownMenuItem onClick={() => onEdit(item.id)} className="font-rubik cursor-pointer gap-2">
                        <FiEdit className="w-4 h-4" /> Edit
                      </DropdownMenuItem>
                    )}
                    {showDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(item.id)} className="font-rubik cursor-pointer gap-2 text-destructive focus:text-destructive">
                          <FiTrash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkspaceContentList;
