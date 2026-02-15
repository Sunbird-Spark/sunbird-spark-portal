import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './QumlEditor.module.css';
import {
  qumlEditorService,
  type EditorConfig,
  type QuestionSetMetadata,
  type QumlEditorEvent,
} from '../../services/QumlEditorService';

type QumlEditorProps = {
  metadata?: QuestionSetMetadata;
  mode?: EditorConfig['config']['mode'];
  contextOverrides?: Partial<EditorConfig['context']>;
  onEditorEvent?: (event: QumlEditorEvent) => void;
  onTelemetryEvent?: (event: any) => void;
  onPlayerEvent?: (event: any) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ensureFancytree = async (): Promise<any> => {
  const currentJq = (window as any).$ || (window as any).jQuery;
  if (currentJq?.fn?.fancytree) {
    return currentJq;
  }

  const { default: jq } = await import('jquery');
  window.$ = jq;
  (window as any).jQuery = jq;

  // @ts-expect-error No types for fancytree modules
  await import('jquery.fancytree');
  // @ts-expect-error No types for fancytree modules
  await import('jquery.fancytree/dist/modules/jquery.fancytree.glyph.js');
  // @ts-expect-error No types for fancytree modules
  await import('jquery.fancytree/dist/modules/jquery.fancytree.dnd5.js');

  return jq;
};

const QumlEditor: React.FC<QumlEditorProps> = ({
  metadata,
  mode,
  contextOverrides,
  onEditorEvent,
  onTelemetryEvent,
  onPlayerEvent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorElementRef = useRef<HTMLElement | null>(null);
  const [resolvedMetadata, setResolvedMetadata] = useState<QuestionSetMetadata | null>(metadata || null);
  const fancytreeGuardRef = useRef<number | null>(null);
  const fancyJQRef = useRef<any>(null);

  const normalizedContextOverrides = useMemo(() => contextOverrides || {}, [contextOverrides]);

  const handleEditorEvent = useCallback(
    (event: QumlEditorEvent) => {
      console.log('[QumlEditor] Editor event:', event);
      onEditorEvent?.(event);
    },
    [onEditorEvent]
  );

  const handleTelemetryEvent = useCallback(
    (event: any) => {
      console.log('[QumlEditor] Telemetry event:', event);
      onTelemetryEvent?.(event);
    },
    [onTelemetryEvent]
  );

  const handlePlayerEvent = useCallback(
    (event: any) => {
      console.log('[QumlEditor] Player event:', event);
      onPlayerEvent?.(event);
    },
    [onPlayerEvent]
  );

  useEffect(() => {
    const resolveMetadata = () => {
      if (metadata) {
        setResolvedMetadata(metadata);
        return;
      }

      setResolvedMetadata(null);
    };

    resolveMetadata();
  }, [metadata]);

  // Initialize editor once metadata is available
  useEffect(() => {
    let isMounted = true;

    const mountEditor = async () => {
      if (!containerRef.current || !resolvedMetadata) {
        return;
      }

      try {
        if (!(window as any).Reflect?.getMetadata) {
          await import('reflect-metadata');
        }

        const jq = await ensureFancytree();
        fancyJQRef.current = jq;

        // Prevent legacy script reloads if the player is already registered
        if (!(window as any).sunbirdQumlPlayerReady && customElements.get('sunbird-quml-player')) {
          (window as any).sunbirdQumlPlayerReady = true;
        }

        // If/when the player is defined, restore the FancyTree-enabled jQuery onto globals
        customElements
          .whenDefined('sunbird-quml-player')
          .then(() => {
            if (fancyJQRef.current) {
              (window as any).$ = fancyJQRef.current;
              (window as any).jQuery = fancyJQRef.current;
            }
          })
          .catch(() => {});

        const config = await qumlEditorService.createConfig(resolvedMetadata, {
          mode,
          contextOverrides: normalizedContextOverrides,
        });

        if (!isMounted) return;

        const editorElement = qumlEditorService.createElement(config);

        qumlEditorService.attachEventListeners(
          editorElement,
          handleEditorEvent,
          handleTelemetryEvent,
          handlePlayerEvent,
        );

        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(editorElement);

        editorElementRef.current = editorElement;

        // Guard: restore FancyTree if some script drops the plugin (often when player bootstraps)
        fancytreeGuardRef.current = window.setInterval(async () => {
          const jqCurrent = (window as any).$ || (window as any).jQuery;
          if (!jqCurrent || (jqCurrent.fn && jqCurrent.fn.fancytree)) return;
          try {
            const base = fancyJQRef.current || jqCurrent;
            (window as any).$ = base;
            (window as any).jQuery = base;
            // @ts-expect-error dynamic import without types
            await import('jquery.fancytree');
            // @ts-expect-error dynamic import without types
            await import('jquery.fancytree/dist/modules/jquery.fancytree.glyph.js');
            // @ts-expect-error dynamic import without types
            await import('jquery.fancytree/dist/modules/jquery.fancytree.dnd5.js');
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[QumlEditor] Failed to restore FancyTree', e);
          }
        }, 800);
      } catch (error: any) {
        console.error('[QumlEditor] Failed to initialize editor', error);
        if (!isMounted) return;
      }
    };

    mountEditor();

    return () => {
      isMounted = false;
      if (editorElementRef.current) {
        qumlEditorService.removeEventListeners(editorElementRef.current);
        editorElementRef.current.remove();
        editorElementRef.current = null;
      }
      if (fancytreeGuardRef.current) {
        clearInterval(fancytreeGuardRef.current);
        fancytreeGuardRef.current = null;
      }
    };
  }, [handleEditorEvent, handlePlayerEvent, handleTelemetryEvent, mode, normalizedContextOverrides, resolvedMetadata]);

  return (
    <div className={styles.qumlEditorPage}>
      <div className={styles.qumlEditorHost} ref={containerRef} />
    </div>
  );
};

export default QumlEditor;
