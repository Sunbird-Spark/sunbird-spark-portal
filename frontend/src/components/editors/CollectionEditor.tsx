import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  CollectionEditorEvent,
  CollectionEditorService,
  type CollectionEditorContextProps,
} from '../../services/editors/collection-editor';
import { useFancytreeGuard } from '../../hooks/useFancytreeGuard';
import PageLoader from '../common/PageLoader';

// Dynamically load the theme CSS after editor assets are loaded
const loadThemeCSS = () => {
  const linkId = 'collection-editor-theme-css';
  if (document.getElementById(linkId)) return;
  
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = new URL('./CollectionEditorTheme.css', import.meta.url).href;
  document.head.appendChild(link);
};

const removeThemeCSS = () => {
  const link = document.getElementById('collection-editor-theme-css');
  if (link) link.remove();
};

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

  // Memoize event handlers to maintain referential equality across renders.
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

  // Guard: keep the FancyTree-capable jQuery alive on globalThis.
  // Starts only after the editor is fully mounted (status === 'ready').
  // All scheduling state is managed inside the hook via refs — no re-renders.
  useFancytreeGuard(status === 'ready');

  // CSS lifecycle: inject the collection-editor stylesheet on mount,
  // remove it on unmount so it doesn't bleed into the rest of the portal.
  useEffect(() => {
    serviceRef.current.loadAssets();
    
    return () => {
      serviceRef.current.removeAssets();
      removeThemeCSS();
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

        // Wait for FancyTree and other dependencies to be fully initialized
        await serviceRef.current.initializeDependencies();
        if (cancelled) return;

        // Load theme CSS after FancyTree is initialized
        loadThemeCSS();

        const service = serviceRef.current;
        const config = await service.createConfig(metadata, contextProps);
        if (cancelled) return;

        editorElement = service.createElement(config);
        service.attachEventListeners(editorElement, handleEditorEvent, handleTelemetryEvent);

        containerRef.current.appendChild(editorElement);
        setStatus('ready');
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
    };
  }, [identifier, metadata, contextProps, handleEditorEvent, handleTelemetryEvent]);

  return (
    <div className="w-full h-full min-h-[600px] relative" id="collection-editor-wrapper">
      {status === 'loading' && (
        <div className="collection-editor-loader-wrapper">
          <PageLoader message="Loading..." fullPage={true} />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" id="collection-editor-container" />
    </div>
  );
};

export default CollectionEditor;
