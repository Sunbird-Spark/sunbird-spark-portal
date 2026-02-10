import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiUpload, FiUsers } from "react-icons/fi";

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/home/Sheet";
import PageLoader from "@/components/common/PageLoader";
import Footer from "@/components/home/Footer";
import HomeSidebar from "@/components/home/HomeSidebar";
import { type WorkspaceView, type UserRole } from "@/components/workspace/WorkspaceSidebar";
import CreateOptions from "@/components/workspace/CreateOptions";
import WorkspaceContentCard from "@/components/workspace/WorkspaceContentCard";
import WorkspaceContentList from "@/components/workspace/WorkspaceContentList";
import { type ViewMode, type SortOption, type ContentTypeFilter } from "@/components/workspace/WorkspaceHeader";
import EmptyState from "@/components/workspace/EmptyState";
import SegmentedControlPattern from "@/components/workspace/patterns/SegmentedControlPattern";
import { type WorkspaceItem } from "@/types";
import { getItemCounts, workspaceItems } from "@/data/workspaceData";
import { useToast } from "@/hooks/useToast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppI18n } from "@/hooks/useAppI18n";
import WorkspacePageHeader from "./WorkspacePageHeader";
import "../home/home.css";
import CreateContentModal from "@/pages/workspace/CreateContentModal";

const WorkspacePage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { t } = useAppI18n();
  const [isLoading, setIsLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("workspace");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('creator');
  const [activeView, setActiveView] = useState<WorkspaceView>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [typeFilter, setTypeFilter] = useState<ContentTypeFilter>('all');
  const [items, setItems] = useState<WorkspaceItem[]>(workspaceItems);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const counts = getItemCounts();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Reset view when role changes
  useEffect(() => {
    if (userRole === 'creator') {
      setActiveView('all');
    } else {
      setActiveView('pending-review');
    }
  }, [userRole]);

  const filteredItems = useMemo(() => {
    let filtered = [...items];
    
    // Apply view-specific filters
    if (activeView === 'drafts') filtered = filtered.filter(i => i.status === 'draft');
    else if (activeView === 'review' || activeView === 'pending-review') filtered = filtered.filter(i => i.status === 'review');
    else if (activeView === 'published' || activeView === 'my-published') filtered = filtered.filter(i => i.status === 'published');
    else if (activeView === 'all') { /* show all */ }
    
    // Apply type filter
    if (typeFilter !== 'all') filtered = filtered.filter(i => i.type === typeFilter);
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(i => 
        i.title.toLowerCase().includes(query) || 
        i.description.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'updated': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'created': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'title': return a.title.localeCompare(b.title);
        default: return 0;
      }
    });
    
    return filtered;
  }, [items, activeView, typeFilter, searchQuery, sortBy]);

  const handleCreateOption = (optionId: string) => {
    setShowCreateModal(false);
    toast({ 
      title: "Starting Editor", 
      description: `Launching ${optionId.replace('-', ' ')} editor...` 
    });
  };

  const handleEdit = (_id: string) => {
    toast({ title: "Edit Content", description: "Opening content editor..." });
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast({ 
      title: "Content Deleted", 
      description: "The content has been removed.", 
      variant: "destructive" 
    });
  };

  const handleView = (_id: string) => {
    toast({ title: "Preview", description: "Opening content preview..." });
  };

  const handleSubmitReview = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'review' as const } : item
    ));
    toast({ 
      title: "Submitted for Review", 
      description: "Your content has been submitted for review." 
    });
  };

  const handleCreateClick = () => {
    setShowCreateModal(true);
  };

  const renderContent = () => {
    // Create modal/view
    if (showCreateModal || activeView === 'create') {
      return (
        <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100/80">
          <CreateOptions onOptionSelect={handleCreateOption} />
        </div>
      );
    }

    // Uploads empty state
    if (activeView === 'uploads') {
      return (
        <EmptyState
          title={t('noUploadsYet')}
          description={t('uploadHere')}
          actionLabel={t('uploadContent')}
          onAction={() => handleCreateOption('upload-content')}
          icon={FiUpload}
          variant="uploads"
        />
      );
    }

    // Collaborations empty state
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

    // Empty results
    if (filteredItems.length === 0) {
      return (
        <EmptyState
          title={searchQuery ? t('noContentFound') : t('createFirst')}
          description={searchQuery ? t('tryAdjusting') : t('createFirst')}
          actionLabel={!searchQuery ? t('createContent') : undefined}
          onAction={!searchQuery ? handleCreateClick : undefined}
          variant={searchQuery ? 'search' : 'default'}
        />
      );
    }

    // Content grid or list
    return viewMode === 'grid' ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredItems.map(item => (
          <WorkspaceContentCard
            key={item.id}
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            onSubmitReview={handleSubmitReview}
          />
        ))}
      </div>
    ) : (
      <WorkspaceContentList
        items={filteredItems}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onSubmitReview={handleSubmitReview}
      />
    );
  };

  const navigationProps = {
    activeView,
    onViewChange: setActiveView,
    userRole,
    onRoleChange: setUserRole,
    counts,
    searchQuery,
    onSearchChange: setSearchQuery,
    viewMode,
    onViewModeChange: setViewMode,
    sortBy,
    onSortChange: setSortBy,
    typeFilter,
    onTypeFilterChange: setTypeFilter,
    contentCount: !['create', 'uploads', 'collaborations'].includes(activeView) ? filteredItems.length : undefined,
    onCreateClick: handleCreateClick,
  };

  if (isLoading) return <PageLoader message={t('loading')} />;

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex">
      {/* Left Sidebar - Desktop */}
      {!isMobile && (
        <HomeSidebar activeNav={activeNav} onNavChange={setActiveNav} />
      )}

      {/* Left Sidebar - Mobile Sheet */}
      {isMobile && (
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="p-0 w-[220px]">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <HomeSidebar activeNav={activeNav} onNavChange={(nav) => {
              setActiveNav(nav);
              setIsSidebarOpen(false);
            }} />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <WorkspacePageHeader
          isMobile={isMobile}
          onMenuOpen={() => setIsSidebarOpen(true)}
          onBack={() => navigate(-1)}
        />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-[#F4F4F4]">
          <div className="home-content-wrapper">
            {/* Navigation */}
            <SegmentedControlPattern {...navigationProps} />

            {/* Content Area */}
            {renderContent()}
          </div>

          {/* Footer */}
          <Footer />
        </main>

        <CreateContentModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onOptionSelect={handleCreateOption}
        />
      </div>
    </div>
  );
};

export default WorkspacePage;
