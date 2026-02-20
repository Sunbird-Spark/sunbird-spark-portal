import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLoader from '@/components/common/PageLoader';
import QumlEditor from '@/components/quml-editor/QumlEditor';
import type { QumlEditorEvent, QumlEditorContextOverrides } from '@/services/editors/quml-editor';
import { QuestionSetService } from '@/services/QuestionSetService';
import { toast } from '@/hooks/useToast';
import { useUserRead } from '@/hooks/useUserRead';

const questionSetService = new QuestionSetService();

const QumlEditorPage = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const { data: userData } = useUserRead();
  const [metadata, setMetadata] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const userRole = useMemo((): 'creator' | 'reviewer' | null => {
    const roles = userData?.data?.response?.roles;
    if (!Array.isArray(roles)) return null;
    const roleNames = roles.map((r: any) => r?.role).filter(Boolean);
    if (roleNames.includes('CONTENT_REVIEWER')) return 'reviewer';
    if (roleNames.includes('CONTENT_CREATOR')) return 'creator';
    return null;
  }, [userData]);

  useEffect(() => {
    if (!contentId) {
      setLoading(false);
      return;
    }

    questionSetService
      .getQuestionset(contentId)
      .then((res: any) => {
        const questionSet = res?.questionset;
        if (!questionSet) throw new Error('No question set found');
        setMetadata(questionSet);
      })
      .catch(() => toast({ title: 'Error', description: 'Failed to load question set metadata.', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [contentId]);

  // Derive editor mode from the content's status and the user's role:
  //   FlagDraft / FlagReview        → 'read'   (flagged content, no editing for anyone)
  //   Review + creator              → 'read'   (creator cannot edit while under review)
  //   Review + reviewer             → 'review' (reviewer can act on the review)
  //   Processing                    → 'read'   (locked for both roles while processing)
  //   Live + reviewer               → 'read'   (reviewer cannot edit published content)
  //   everything else               → 'edit'   (Draft, Live for creator, Unlisted …)
  const editorMode = useMemo((): 'read' | 'review' | 'edit' => {
    const s = metadata?.status as string | undefined;
    if (!s) return 'edit';
    if (s === 'FlagDraft' || s === 'FlagReview') return 'read';
    if (s === 'Processing') return 'read';
    if (s === 'Review') return userRole === 'reviewer' ? 'review' : 'read';
    if (s === 'Live' && userRole === 'reviewer') return 'read';
    return 'edit';
  }, [metadata?.status, userRole]);

  const contextOverrides: QumlEditorContextOverrides = useMemo(() => ({
    mode: editorMode,
  }), [editorMode]);

  const handleEditorEvent = useCallback((event: QumlEditorEvent) => {
    const closeEditor = (event.data as any)?.close;
    if (closeEditor) {
      navigate('/workspace');
    }
  }, [navigate]);

  const handleTelemetryEvent = useCallback((_event: any) => {}, []);

  if (loading) {
    return <PageLoader message="Loading editor..." />;
  }

  if (!metadata) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <div className="text-red-600 font-semibold">{'Question set not found'}</div>
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
            onClick={() => navigate('/workspace')}
            className="rounded bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
          >
            Back to workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <QumlEditor
        metadata={metadata}
        mode={editorMode}
        contextOverrides={contextOverrides}
        onEditorEvent={handleEditorEvent}
        onTelemetryEvent={handleTelemetryEvent}
      />
    </div>
  );
};

export default QumlEditorPage;
