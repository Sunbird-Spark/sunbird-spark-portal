import { useNavigate } from 'react-router-dom';
import { useAppI18n } from '@/hooks/useAppI18n';

interface EditorErrorStateProps {
  message: string;
  showRetry?: boolean;
}

/**
 * Shared full-screen error state used by all editor pages
 * for lock errors and content-not-found errors.
 */
const EditorErrorState = ({ message, showRetry = false }: EditorErrorStateProps) => {
  const navigate = useNavigate();
  const { t } = useAppI18n();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <div className="text-red-600 font-semibold">{message}</div>
      <div className="flex gap-2">
        {showRetry && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {t('retry')}
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('/workspace')}
          className="rounded bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
        >
          {t('content.backToWorkspace')}
        </button>
      </div>
    </div>
  );
};

export default EditorErrorState;
