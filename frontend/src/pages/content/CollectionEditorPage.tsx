import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLoader from '@/components/common/PageLoader';
import CollectionEditor from '@/components/editors/CollectionEditor';
import type { CollectionEditorEvent, CollectionEditorContextProps } from '@/services/editors/collection-editor';
import { ContentService } from '@/services/ContentService';
import { toast } from '@/hooks/useToast';
import { useUserRead } from '@/hooks/useUserRead';
import { getUserRole, getEditorMode } from '@/services/editors/editorModeService';

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

  const userRole = useMemo(() => getUserRole(userData), [userData]);

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

  const editorMode = useMemo(
    () => getEditorMode(metadata?.status, userRole),
    [metadata?.status, userRole],
  );

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
