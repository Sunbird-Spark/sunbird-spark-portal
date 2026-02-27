import { useParams, useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import PageLoader from '@/components/common/PageLoader';
import EditorErrorState from '@/components/editors/EditorErrorState';
import { ContentEditor } from '@/components/editors/ContentEditor';
import type { ContentEditorEvent } from '@/services/editors/content-editor';
import { useContentRead } from '@/hooks/useContent';
import { useAppI18n } from '@/hooks/useAppI18n';
import { useEditorLock } from '@/hooks/useEditorLock';

const ContentEditorPage = () => {
  const { t } = useAppI18n();
  const { contentId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useContentRead(contentId || '');
  const contentData = data?.data?.content;

  const { lockError, isLocking, retireLock } = useEditorLock({
    contentId,
    metadata: contentData ?? null,
  });

  // Memoize the event handler to prevent unnecessary re-renders
  const handleEditorEvent = useCallback((event: ContentEditorEvent) => {
    console.warn('Content editor event:', event);
  }, []);

  // Memoize the close handler to prevent unnecessary re-renders
  const handleClose = useCallback(async () => {
    await retireLock();
    navigate('/workspace');
  }, [retireLock, navigate]);

  // Memoize contentData to prevent unnecessary re-renders when object reference changes
  // but actual content hasn't changed
  const stableMetadata = useMemo(() => contentData, [contentData?.identifier]);

  if (isLoading || isLocking) {
    return <PageLoader message={isLocking ? "Acquiring content lock..." : "Loading editor..."} />;
  }

  if (lockError) {
    return <EditorErrorState message={lockError} />;
  }

  if (error) {
    return <EditorErrorState message={`Error loading content: ${error.message}`} showRetry />;
  }

  if (!stableMetadata) {
    return <EditorErrorState message="Content not found" />;
  }

  return (
    <div className="w-full h-screen">
      <ContentEditor
        metadata={stableMetadata}
        onEditorEvent={handleEditorEvent}
        onClose={handleClose}
      />
    </div>
  );
};

export default ContentEditorPage;
