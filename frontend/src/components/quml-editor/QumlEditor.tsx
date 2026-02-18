import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './QumlEditor.module.css';
import {
  QumlEditorService,
  type QumlEditorConfig,
  type QuestionSetMetadata,
  type QumlEditorEvent,
  type QumlEditorContextOverrides,
} from '../../services/editors/quml-editor';

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
  const fancytreeGuardRef = useRef<number | null>(null);
  const fancyJQRef = useRef<any>(null);

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

        // Store jQuery reference with FancyTree for restoration
        const $global = (globalThis as any).$;
        if ($global?.fn?.fancytree) {
          fancyJQRef.current = $global;
        }

        const service = serviceRef.current;
        const config = await service.createConfig(metadata, { mode, ...contextOverrides });

        if (cancelled) return;

        editorElement = service.createElement(config);
        service.attachEventListeners(editorElement, handleEditorEvent, handleTelemetryEvent);

        containerRef.current.appendChild(editorElement);
        setStatus('ready');

        // Guard: restore FancyTree if web component overwrites jQuery.
        let guardInterval = 800;
        const scheduleGuard = () => {
          fancytreeGuardRef.current = window.setTimeout(() => {
            const jqCurrent = (globalThis as any).$ || (globalThis as any).jQuery;
            if (jqCurrent?.fn?.fancytree) {
              guardInterval = Math.min(guardInterval * 2, 30_000);
            } else {
              if (fancyJQRef.current) {
                (globalThis as any).$ = fancyJQRef.current;
                (globalThis as any).jQuery = fancyJQRef.current;
              }
              guardInterval = 800;
            }
            scheduleGuard();
          }, guardInterval);
        };
        scheduleGuard();
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
      if (fancytreeGuardRef.current) {
        clearTimeout(fancytreeGuardRef.current);
        fancytreeGuardRef.current = null;
      }
    };
  }, [metadata, mode, contextOverrides, handleEditorEvent, handleTelemetryEvent]);

  return (
    <div className={styles.qumlEditorPage}>
      {status === 'loading' && <div className="p-4">Loading Editor...</div>}
      <div className={styles.qumlEditorHost} ref={containerRef} />
    </div>
  );
};

export default QumlEditor;
