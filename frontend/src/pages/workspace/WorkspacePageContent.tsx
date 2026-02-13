import { FiUpload, FiUsers } from "react-icons/fi";
import CreateOptions from "@/components/workspace/CreateOptions";
import WorkspaceContentCard from "@/components/workspace/WorkspaceContentCard";
import WorkspaceContentList from "@/components/workspace/WorkspaceContentList";
import EmptyState from "@/components/workspace/EmptyState";
import { type WorkspaceItem } from "@/types/workspaceTypes";

interface WorkspacePageContentProps {
  showCreateModal: boolean;
  activeView: string;
  filteredItems: WorkspaceItem[];
  viewMode: 'grid' | 'list';
  t: (key: string) => string;
  onCreateOption: (optionId: string) => void;
  onCreateClick: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onSubmitReview: (id: string) => void;
}

export default function WorkspacePageContent({
  showCreateModal,
  activeView,
  filteredItems,
  viewMode,
  t,
  onCreateOption,
  onCreateClick,
  onEdit,
  onDelete,
  onView,
  onSubmitReview,
}: WorkspacePageContentProps) {
  if (showCreateModal || activeView === 'create') {
    return (
      <div className="bg-white rounded-[1.25rem] p-6 shadow-sm border border-border">
        <CreateOptions onOptionSelect={onCreateOption} />
      </div>
    );
  }
  if (activeView === 'uploads') {
    return (
      <EmptyState
        title={t('noUploadsYet')}
        description={t('uploadHere')}
        actionLabel={t('uploadContent')}
        onAction={() => onCreateOption('upload-content')}
        icon={FiUpload}
        variant="uploads"
      />
    );
  }
  if (activeView === 'collaborations') {
    return (
      <EmptyState
        title={t('noCollaborations')}
        description={t('sharedWithYou')}
        icon={FiUsers}
        variant="collaborations"
      />
    );
  }
  if (filteredItems.length === 0) {
    return (
      <EmptyState
        title={t('createFirst')}
        description={t('createFirst')}
        actionLabel={t('createContent')}
        onAction={onCreateClick}
        variant="default"
      />
    );
  }
  return viewMode === 'grid' ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {filteredItems.map(item => (
        <WorkspaceContentCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          onSubmitReview={onSubmitReview}
        />
      ))}
    </div>
  ) : (
    <WorkspaceContentList
      items={filteredItems}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
      onSubmitReview={onSubmitReview}
    />
  );
}
