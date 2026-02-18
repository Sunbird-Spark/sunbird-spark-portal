import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLoader from '@/components/common/PageLoader';
import CollectionEditor from '@/components/editors/CollectionEditor';
import type { CollectionEditorEvent, CollectionEditorContextProps } from '@/services/editors/collection-editor';
import { ContentService } from '@/services/ContentService';
import { toast } from '@/hooks/useToast';

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
  const [metadata, setMetadata] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contentId) {
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
      .catch((e: any) => toast({ title: 'Error', description: 'Failed to load content metadata.', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [contentId]);

  // Derive editor mode from the content's current backend status:
  //   FlagDraft / FlagReview  → 'read'   (flagged content, no editing allowed)
  //   Review / Processing     → 'review' (in-review workflow)
  //   everything else         → 'edit'   (Draft, Live, Unlisted …)
  const editorMode = useMemo((): 'read' | 'review' | 'edit' => {
    const s = metadata?.status as string | undefined;
    if (!s) return 'edit';
    if (s === 'FlagDraft' || s === 'FlagReview') return 'read';
    if (s === 'Review' || s === 'Processing') return 'review';
    return 'edit';
  }, [metadata?.status]);

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
