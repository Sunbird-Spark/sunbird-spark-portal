import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './QumlEditor.module.css';
import {
  QumlEditorService,
  type QumlEditorConfig,
  type QuestionSetMetadata,
  type QumlEditorEvent,
  type QumlEditorContextOverrides,
} from '../../services/editors/quml-editor';
import { useFancytreeGuard } from '../../hooks/useFancytreeGuard';
import PageLoader from '../common/PageLoader';

type QumlEditorProps = {
  metadata?: QuestionSetMetadata;
  mode?: QumlEditorConfig['config']['mode'];
  contextOverrides?: QumlEditorContextOverrides;
  onEditorEvent?: (event: QumlEditorEvent) => void;
  onTelemetryEvent?: (event: any) => void;
};

const QumlEditor: React.FC<QumlEditorProps> = ({
  metadata,
  mode,
  contextOverrides,
  onEditorEvent,
  onTelemetryEvent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<QumlEditorService>(new QumlEditorService());
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Use the fancytree guard hook to maintain jQuery with FancyTree
  useFancytreeGuard(status === 'ready');

  const handleEditorEvent = useCallback(
    (event: QumlEditorEvent) => {
      onEditorEvent?.(event);
    },
    [onEditorEvent]
  );

  const handleTelemetryEvent = useCallback(
    (event: any) => {
      onTelemetryEvent?.(event);
    },
    [onTelemetryEvent]
  );
  
  // CSS lifecycle: add quml-editor stylesheet on mount,
  // remove it on unmount so it does not bleed into the rest of the portal.
  useEffect(() => {
    serviceRef.current.loadAssets();
    return () => {
      serviceRef.current.removeAssets();
    };
  }, []);

  useEffect(() => {
    let editorElement: HTMLElement | null = null;
    let cancelled = false;

    const initEditor = async () => {
      try {
        if (!containerRef.current || !metadata) {
          console.warn('[QumlEditor] Container or metadata not available');
          return;
        }

        await serviceRef.current.initializeDependencies();

        if (cancelled) return;

        const service = serviceRef.current;
        const config = await service.createConfig(metadata, { mode, ...contextOverrides });

        if (cancelled) return;

        editorElement = service.createElement(config);
        service.attachEventListeners(editorElement, handleEditorEvent, handleTelemetryEvent);

        containerRef.current.appendChild(editorElement);
        setStatus('ready');
      } catch (error: any) {
        console.error('[QumlEditor] Failed to initialize editor:', error);
        setStatus('error');
      }
    };

    initEditor();

    return () => {
      cancelled = true;
      if (editorElement) {
        serviceRef.current.removeEventListeners(editorElement);
        editorElement.remove();
      }
    };
  }, [metadata, mode, contextOverrides, handleEditorEvent, handleTelemetryEvent]);

  return (
    <div className={styles.qumlEditorPage}>
      {status === 'loading' && <PageLoader message="Loading editor..." />}
      <div className={styles.qumlEditorHost} ref={containerRef} />
    </div>
  );
};

export default QumlEditor;
