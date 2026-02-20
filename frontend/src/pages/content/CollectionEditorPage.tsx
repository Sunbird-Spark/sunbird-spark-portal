import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLoader from '@/components/common/PageLoader';
import CollectionEditor from '@/components/editors/CollectionEditor';
import type { CollectionEditorEvent, CollectionEditorContextProps } from '@/services/editors/collection-editor';
import { ContentService } from '@/services/ContentService';
import { toast } from '@/hooks/useToast';
import { useUserRead } from '@/hooks/useUserRead';

const COLLECTION_EDITOR_READ_FIELDS = [
  'identifier',
  'name',
  'description',
  'objectType',
  'createdBy',
  'status',
  'mimeType',
  'contentType',
  'resourceType',
  'collaborators',
  'contentDisposition',
  'primaryCategory',
  'framework',
  'targetFWIds',
];

const contentService = new ContentService();

const CollectionEditorPage = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const { data: userData } = useUserRead();
  const [metadata, setMetadata] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const userRole = useMemo((): 'creator' | 'reviewer' | null => {
    const roles = userData?.data?.response?.roles;
    if (!Array.isArray(roles)) return null;
    const roleNames = roles.map((r) => r?.role).filter(Boolean);
    if (roleNames.includes('CONTENT_REVIEWER')) return 'reviewer';
    if (roleNames.includes('CONTENT_CREATOR')) return 'creator';
    return null;
  }, [userData]);

  useEffect(() => {
    setLoadError(null);

    if (!contentId) {
      setLoadError('Missing content identifier.');
      setLoading(false);
      return;
    }

    contentService
      .contentRead(contentId, COLLECTION_EDITOR_READ_FIELDS, 'edit')
      .then((res) => {
        const content = res.data?.content;
        if (!content) throw new Error('No content found');
        setMetadata(content);
      })
      .catch(() => {
        setLoadError('Failed to load content metadata.');
        toast({ title: 'Error', description: 'Failed to load content metadata.', variant: 'destructive' });
      })
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

  const contextProps: CollectionEditorContextProps = useMemo(() => ({
    mode: editorMode,
    objectType: 'Collection',
    primaryCategory: metadata?.primaryCategory,
  }), [editorMode, metadata?.primaryCategory]);


  const handleEditorEvent = useCallback((event: CollectionEditorEvent) => {
    const closeEditor = (event.data as any)?.close;
    if (closeEditor) {
      navigate('/workspace');
    }
  }, [navigate]);

  const handleTelemetryEvent = useCallback((_event: any) => {}, []);

  if (loading) {
    return <PageLoader message="Loading editor..." />;
  }

  if (loadError || !metadata) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <div className="text-red-600 font-semibold">{loadError || 'Content not found'}</div>
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
      <CollectionEditor
        identifier={metadata.identifier}
        metadata={metadata}
        contextProps={contextProps}
        onEditorEvent={handleEditorEvent}
        onTelemetryEvent={handleTelemetryEvent}
      />
    </div>
  );
};

export default CollectionEditorPage;
