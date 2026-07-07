import React, { useEffect, useState } from 'react';
import { CollectionEditor as SunbirdCollectionEditor } from '@project-sunbird/collection-editor-react';
import type { IEditorConfig, ToolbarAction } from '@project-sunbird/collection-editor-react';
import '@project-sunbird/collection-editor-react/dist/style.css';
import { buildCollectionEditorConfig } from '@/services/editors/collection-editor/CollectionEditorConfigBuilder';
import PageLoader from '../common/PageLoader';
import { useAppI18n } from '@/hooks/useAppI18n';

interface CollectionEditorProps {
  identifier: string;
  metadata: Record<string, any>;
  mode: string;
  onToolbarEvent?: (event: { action: ToolbarAction; data?: unknown }) => void;
}

const CollectionEditor: React.FC<CollectionEditorProps> = ({
  identifier,
  metadata,
  mode,
  onToolbarEvent,
}) => {
  const { t } = useAppI18n();
  const [config, setConfig] = useState<IEditorConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    buildCollectionEditorConfig(metadata, mode)
      .then((cfg) => { if (!cancelled) setConfig(cfg); })
      .catch((err) => {
        console.error('[CollectionEditor] Failed to build config:', err);
        if (!cancelled) setError(t('content.failedToLoadEditor') || 'Failed to load editor');
      });

    return () => { cancelled = true; };
  }, [identifier, mode]);

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  if (!config) {
    return (
      <div className="w-full h-full min-h-[600px] relative">
        <PageLoader message={t('loading')} fullPage />
      </div>
    );
  }

  return (
    <div className="w-full h-full" id="collection-editor-wrapper">
      <SunbirdCollectionEditor
        {...config}
        onToolbarEvent={onToolbarEvent}
      />
    </div>
  );
};

export default CollectionEditor;
