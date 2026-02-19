import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  CollectionEditorEvent,
  CollectionEditorService,
  type CollectionEditorContextProps,
} from '../../services/editors/collection-editor';
import PageLoader from '../common/PageLoader';

interface CollectionEditorProps {
  identifier: string;
  metadata: any;
  contextProps: CollectionEditorContextProps;
  onEditorEvent?: (event: CollectionEditorEvent) => void;
  onTelemetryEvent?: (event: any) => void;
}

const CollectionEditor: React.FC<CollectionEditorProps> = ({
  identifier,
  metadata,
  contextProps,
  onEditorEvent,
  onTelemetryEvent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<CollectionEditorService>(new CollectionEditorService());
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const fancytreeGuardRef = useRef<number | null>(null);
  const fancyJQRef = useRef<any>(null);

  // Memoize event handler to maintain referential equality
  const handleEditorEvent = useCallback(
    (event: CollectionEditorEvent) => {
      onEditorEvent?.(event);
    },
    [onEditorEvent],
  );

  const handleTelemetryEvent = useCallback(
    (event: any) => {
      onTelemetryEvent?.(event);
    },
    [onTelemetryEvent],
  );

  // CSS lifecycle: add the collection-editor stylesheet on mount,
  // remove it on unmount so it doesn't bleed into the rest of the portal.
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
          console.warn('[CollectionEditor] Container or metadata not available');
          return;
        }
        await serviceRef.current.initializeDependencies();

        if (cancelled) return;

        // Keep a jQuery reference that already has FancyTree attached.
        const $global = (globalThis as any).$;
        if ($global?.fn?.fancytree) {
          fancyJQRef.current = $global;
        }

        const service = serviceRef.current;
        const config = await service.createConfig(metadata, contextProps);

        if (cancelled) return;

        editorElement = service.createElement(config);
        service.attachEventListeners(editorElement, handleEditorEvent, handleTelemetryEvent);

        containerRef.current.appendChild(editorElement);
        setStatus('ready');

        // Guard: restore FancyTree-capable jQuery if editor bundle/web-component overwrites global $.
        let guardInterval = 800;
        const scheduleGuard = () => {
          fancytreeGuardRef.current = window.setTimeout(() => {
            const jqCurrent = (globalThis as any).$ || (globalThis as any).jQuery;
            if (jqCurrent?.fn?.fancytree) {
              guardInterval = Math.min(guardInterval * 2, 30_000);
            } else {
              if (fancyJQRef.current?.fn?.fancytree) {
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
        console.error('Failed to initialize Collection Editor:', error);
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
  }, [identifier, metadata, contextProps, handleEditorEvent, handleTelemetryEvent]);

  return (
    <div className="w-full h-full min-h-[600px] relative" id="collection-editor-wrapper">
      {status === 'loading' && <PageLoader message="Loading..." fullPage={false} />}
      <div ref={containerRef} className="w-full h-full" id="collection-editor-container" />
    </div>
  );
};

export default CollectionEditor;
