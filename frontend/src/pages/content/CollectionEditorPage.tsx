import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLoader from '@/components/common/PageLoader';
import EditorErrorState from '@/components/editors/EditorErrorState';
import CollectionEditor from '@/components/editors/CollectionEditor';
import type { CollectionEditorEvent, CollectionEditorContextProps } from '@/services/editors/collection-editor';
import { ContentService } from '@/services/ContentService';
import { useAppI18n } from '@/hooks/useAppI18n';
import { toast } from '@/hooks/useToast';
import { useEditorLock } from '@/hooks/useEditorLock';
import useImpression from '@/hooks/useImpression';
import useInteract from '@/hooks/useInteract';

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
  const { t } = useAppI18n();
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const { interact } = useInteract();
  const [metadata, setMetadata] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useImpression({ type: 'view', pageid: 'collection-editor', object: { id: contentId || '', type: 'Content' } });

  useEffect(() => {
    setLoadError(null);

    if (!contentId) {
      setLoadError(t('content.missingIdentifier'));
      setLoading(false);
      return;
    }

    contentService
      .contentRead(contentId, COLLECTION_EDITOR_READ_FIELDS, 'edit')
      .then((res) => {
        const content = res.data?.content;
        if (!content) throw new Error(t('content.notFound'));
        setMetadata(content);
      })
      .catch(() => {
        setLoadError(t('content.failedToLoadMetadata'));
        toast({ title: t('error'), description: t('content.failedToLoadMetadata'), variant: 'destructive' });
      })
      .finally(() => setLoading(false));
  }, [contentId]);

  const { editorMode, lockError, isLocking, retireLock } = useEditorLock({
    contentId,
    metadata,
  });

  const contextProps: CollectionEditorContextProps = useMemo(() => ({
    mode: editorMode,
    objectType: 'Collection',
    primaryCategory: metadata?.primaryCategory,
  }), [editorMode, metadata?.primaryCategory]);


  const handleEditorEvent = useCallback(async (event: CollectionEditorEvent) => {
    interact({
      id: 'collection-editor-event',
      type: 'OTHER',
      pageid: 'collection-editor',
      cdata: [{ id: contentId || '', type: 'ContentId' }],
    });

    const closeEditor = (event.data as any)?.close;
    if (closeEditor) {
      await retireLock();
      navigate('/workspace');
    }
  }, [navigate, retireLock, interact, contentId]);

  const handleTelemetryEvent = useCallback((_event: any) => {
      // Direct raw telemetry feed from iframe (optional mapping)
  }, []);

  if (loading || isLocking) {
    return <PageLoader message={isLocking ? t('content.acquiringLock') : t('content.loadingEditor')} />;
  }

  if (lockError) {
    return <EditorErrorState message={lockError} />;
  }

  if (loadError || !metadata) {
    return <EditorErrorState message={loadError || t('content.notFound')} showRetry />;
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
