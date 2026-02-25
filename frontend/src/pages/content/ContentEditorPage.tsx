import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLoader from '@/components/common/PageLoader';
import { ContentEditor } from '@/components/editors/ContentEditor';
import type { ContentEditorEvent } from '@/services/editors/content-editor';
import { useContentRead } from '@/hooks/useContent';
import { useContentLock } from '@/hooks/useContentLock';
import { useUserRead } from '@/hooks/useUserRead';
import { getUserRole, getEditorMode } from '@/services/editors/editorModeService';

const ContentEditorPage = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const { data: userData } = useUserRead();

  const { data, isLoading, error } = useContentRead(contentId || '');
  const contentData = data?.data?.content;

  const userRole = useMemo(() => getUserRole(userData), [userData]);
  const editorMode = useMemo(
    () => getEditorMode(contentData?.status, userRole),
    [contentData?.status, userRole],
  );
  const isEditMode = editorMode === 'edit';

  const { lockError, isLocking, retireLock } = useContentLock({
    resourceId: contentId,
    resourceType: 'Content',
    metadata: contentData ?? null,
    enabled: isEditMode,
  });

  const handleEditorEvent = (event: ContentEditorEvent) => {
    console.warn('Content editor event:', event);
  };

  const handleClose = async () => {
    await retireLock();
    navigate('/workspace');
  };

  if (isLoading || isLocking) {
    return <PageLoader message={isLocking ? "Acquiring content lock..." : "Loading editor..."} />;
  }

  if (lockError) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <div className="text-red-600 font-semibold">{lockError}</div>
        <button
          type="button"
          onClick={() => navigate('/workspace')}
          className="rounded bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
        >
          Back to workspace
        </button>
      </div>
    );
  }

  if (error) {
    console.error('Error loading content:', error);
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <div className="text-red-600 font-semibold">
          Error loading content: {error.message}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
          >
            Back to workspace
          </button>
        </div>
      </div>
    );
  }

  if (!contentData) {
    return <div>Content not found</div>;
  }

  return (
    <div className="w-full h-screen">
      <ContentEditor
        metadata={contentData}
        onEditorEvent={handleEditorEvent}
        onClose={handleClose}
      />
    </div>
  );
};

export default ContentEditorPage;
