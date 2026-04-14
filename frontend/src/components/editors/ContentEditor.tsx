import React, { useEffect, useRef, useCallback } from 'react';
import { ContentEditorService } from '../../services/editors/content-editor';
import type { ContentEditorEvent, ContentEditorMetadata } from '../../services/editors/content-editor';
import { useAppI18n } from '@/hooks/useAppI18n';

interface ContentEditorProps {
  metadata: ContentEditorMetadata;
  onEditorEvent?: (event: ContentEditorEvent) => void;
  onClose?: () => void;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  metadata,
  onEditorEvent,
  onClose,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const serviceRef = useRef<ContentEditorService>(new ContentEditorService());
  const isInitializedRef = useRef(false);
  const currentIdentifierRef = useRef<string | null>(null);

  const { t } = useAppI18n();

  const handleEditorEvent = useCallback((event: ContentEditorEvent) => {
    onEditorEvent?.(event);
  }, [onEditorEvent]);

  // Store onClose in a ref so the jQuery shim always has the latest callback
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Only initialize if the content identifier has changed or it's the first load
    if (isInitializedRef.current && currentIdentifierRef.current === metadata.identifier) {
      return;
    }

    const service = serviceRef.current;
    let cancelled = false;

    // Install a jQuery shim on the parent window.
    // The content editor calls window.parent.$('#contentEditor').iziModal('close')
    // to close itself. This shim intercepts that call and triggers our React handler.
    const previousJQuery = (window as any).$;
    const jQueryShim = (selector: string) => {
      const isContentEditorSelector =
        selector === '#contentEditor' || selector === 'iframe#contentEditor';

      // If this is not the content editor selector, delegate to any existing jQuery
      if (!isContentEditorSelector && typeof previousJQuery === 'function') {
        return previousJQuery(selector);
      }

      return {
        iziModal: (action: string) => {
          if (isContentEditorSelector && action === 'close') {
            onCloseRef.current?.();
          }
        },
        css: () => jQueryShim(selector),
        find: () => jQueryShim(selector),
        attr: () => jQueryShim(selector),
      };
    };
    (window as any).$ = jQueryShim;

    const messageHandler = (event: MessageEvent) => {
      if (!event.data) return;

      // Only accept messages from same origin (the editor iframe)
      if (event.origin !== window.location.origin) return;

      const eventData = typeof event.data === 'string'
        ? (() => { try { return JSON.parse(event.data); } catch { return null; } })()
        : event.data;
      if (!eventData) return;

      const editorEvent: ContentEditorEvent = {
        type: eventData.eid || eventData.event || 'unknown',
        data: eventData,
        contentId: metadata.identifier,
        timestamp: Date.now(),
      };

      handleEditorEvent(editorEvent);

      // Handle editor close/save events
      if (
        eventData.event === 'editor:window:close' ||
        eventData.event === 'editor:content:review'
      ) {
        onCloseRef.current?.();
      }
    };

    const initEditor = async () => {
      try {
        const editorConfig = await service.buildConfig(metadata);
        if (cancelled) return;

        // Set window.context and window.config on the PARENT window
        // before loading the iframe. The content editor reads these
        // from window.parent.context / window.parent.config.
        (window as any).context = editorConfig.context;
        (window as any).config = editorConfig.config;

        window.addEventListener('message', messageHandler);

        const editorUrl = service.getEditorUrl();
        iframe.src = editorUrl;

        // Mark as initialized and store current identifier
        isInitializedRef.current = true;
        currentIdentifierRef.current = metadata.identifier;
      } catch (error) {
        console.error('Failed to initialize Content Editor:', error);
      }
    };

    initEditor();

    return () => {
      cancelled = true;
      window.removeEventListener('message', messageHandler);
      // Set iframe src first so the editor can gracefully unload
      // while global properties still exist
      if (iframe) {
        iframe.onload = null;
        iframe.src = 'about:blank';
      }
      // Clean up global window properties
      delete (window as any).context;
      delete (window as any).config;
      // Restore previous jQuery if any, otherwise remove shim
      if (previousJQuery) {
        (window as any).$ = previousJQuery;
      } else {
        delete (window as any).$;
      }
      // Reset initialization flag
      isInitializedRef.current = false;
      currentIdentifierRef.current = null;
    };
  }, [metadata, handleEditorEvent]);

  return (
    <iframe
      ref={iframeRef}
      id="contentEditor"
      name="contentEditor"
      className="w-full h-full border-0 min-h-screen"
      title={t('editors.contentEditor')}
      aria-label={t('editors.contentEditor')}
    />
  );
};
