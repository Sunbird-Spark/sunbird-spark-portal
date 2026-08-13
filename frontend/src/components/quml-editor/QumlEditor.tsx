import { useEffect, useState, type FC } from 'react';
import { QuestionsetEditor } from '@project-sunbird/sunbird-questionset-editor-web-component-react';
import '@project-sunbird/sunbird-questionset-editor-web-component-react/dist/style.css';
import type { QumlEditorConfig, QumlEditorContextOverrides, QumlEditorEvent, QuestionSetMetadata } from '@/services/editors/quml-editor/types';
import { QumlEditorService } from '@/services/editors/quml-editor/QumlEditorService';
import PageLoader from '@/components/common/PageLoader';
import EditorErrorState from '@/components/editors/EditorErrorState';
import { useAppI18n } from '@/hooks/useAppI18n';

interface QumlEditorProps {
  metadata: QuestionSetMetadata;
  mode: 'edit' | 'review' | 'read';
  contextOverrides?: QumlEditorContextOverrides;
  onEditorEvent?: (event: QumlEditorEvent) => void;
  onTelemetryEvent?: (event: unknown) => void;
}

const service = new QumlEditorService();

const QumlEditor: FC<QumlEditorProps> = ({
  metadata,
  mode,
  contextOverrides,
  onEditorEvent,
}) => {
  const { t } = useAppI18n();
  const [config, setConfig] = useState<QumlEditorConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConfig(null);
    setError(null);
    service
      .createConfig(metadata, { ...contextOverrides, mode })
      .then(setConfig)
      .catch(() => setError(t('content.failedToLoadEditor')));
  }, [metadata.identifier, mode]);

  if (error) return <EditorErrorState message={error} />;
  if (!config) return <PageLoader message={t('content.loadingEditor')} />;

  return (
    <QuestionsetEditor
      context={config.context}
      config={config.config}
      metadata={config.metadata as unknown as Record<string, unknown>}
      onToolbarEvent={(event: { action: string; data?: unknown }) => {
        onEditorEvent?.({ type: 'editorEmitter', data: event });
      }}
    />
  );
};

export default QumlEditor;
