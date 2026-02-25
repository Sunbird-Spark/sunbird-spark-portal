import { useParams, useNavigate } from 'react-router-dom';
import PageLoader from '@/components/common/PageLoader';
import { ContentEditor } from '@/components/editors/ContentEditor';
import type { ContentEditorEvent } from '@/services/editors/content-editor';
import { useContentRead } from '@/hooks/useContent';
import { useAppI18n } from '@/hooks/useAppI18n';

const ContentEditorPage = () => {
  const { t } = useAppI18n();
  const { contentId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useContentRead(contentId || '');
  const contentData = data?.data?.content;

  const handleEditorEvent = (event: ContentEditorEvent) => {
    console.warn('Content editor event:', event);
  };

  const handleClose = () => {
    navigate('/workspace');
  };

  if (isLoading) {
    return <PageLoader message={t('content.loadingEditor')} />;
  }

  if (error) {
    console.error('Error loading content:', error);
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <div className="text-red-600 font-semibold">
          {t('content.errorLoading', { error: error.message })}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {t('retry')}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
          >
            {t('content.backToWorkspace')}
          </button>
        </div>
      </div>
    );
  }

  if (!contentData) {
    return <div>{t('content.notFound')}</div>;
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
