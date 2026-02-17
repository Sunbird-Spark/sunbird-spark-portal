import { useParams, useNavigate } from 'react-router-dom';
import PageLoader from '@/components/common/PageLoader';
import { ContentEditor } from '@/components/editors/ContentEditor';
import { useContentRead } from '@/hooks/useContent';

const ContentEditorPage = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useContentRead(contentId || '');
  const contentData = data?.data?.content;

  const handleEditorEvent = (event: any) => {
    console.log('Content editor event:', event);
  };

  const handleClose = () => {
    navigate('/workspace');
  };

  if (isLoading) {
    return <PageLoader message="Loading editor..." />;
  }

  if (error) {
    return <div>Error loading content: {error.message}</div>;
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
