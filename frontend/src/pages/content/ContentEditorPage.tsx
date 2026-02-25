import { useParams, useNavigate } from 'react-router-dom';
import PageLoader from '@/components/common/PageLoader';
import EditorErrorState from '@/components/editors/EditorErrorState';
import { ContentEditor } from '@/components/editors/ContentEditor';
import type { ContentEditorEvent } from '@/services/editors/content-editor';
import { useContentRead } from '@/hooks/useContent';
import { useEditorLock } from '@/hooks/useEditorLock';

const ContentEditorPage = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useContentRead(contentId || '');
  const contentData = data?.data?.content;

  const { lockError, isLocking, retireLock } = useEditorLock({
    contentId,
    metadata: contentData ?? null,
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
    return <EditorErrorState message={lockError} />;
  }

  if (error) {
    return <EditorErrorState message={`Error loading content: ${error.message}`} showRetry />;
  }

  if (!contentData) {
    return <EditorErrorState message="Content not found" />;
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
