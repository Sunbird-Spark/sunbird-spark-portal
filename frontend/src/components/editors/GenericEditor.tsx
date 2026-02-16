/**
 * GenericEditor - React component that integrates the Sunbird Generic Editor.
 *
 * This is a React port of the AngularJS GenericEditorComponent from SunbirdEd-portal.
 * The generic editor loads inside a fullscreen iframe. Communication with the editor
 * happens via window.context and window.config globals that the iframe reads on load.
 *
 * Supported content types: PDF, Video (MP4/WebM/YouTube), HTML archive, EPUB, H5P, URL.
 */

import React, { useEffect, useCallback } from 'react';
import { useGenericEditor } from '@/hooks/useGenericEditor';
import type { GenericEditorRouteParams, GenericEditorQueryParams } from '@/services/editors/generic-editor';

export interface GenericEditorComponentProps {
  /** Content ID to edit (omit for new content) */
  contentId?: string;
  /** Workspace state (draft, allcontent, collaborating-on, uploaded, etc.) */
  state?: string;
  /** Framework ID for categorization */
  framework?: string;
  /** Content status (Draft, Review, Live, etc.) */
  contentStatus?: string;
  /** Whether this is a large file upload flow */
  isLargeFileUpload?: boolean;
  /** Lock query params if content is already locked by this session */
  queryParams?: GenericEditorQueryParams;
  /** Called when the editor is closed */
  onClose?: () => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
}

const GenericEditor: React.FC<GenericEditorComponentProps> = ({
  contentId,
  state,
  framework,
  contentStatus,
  isLargeFileUpload = false,
  queryParams,
  onClose,
  onError,
}) => {
  const params: GenericEditorRouteParams = {
    contentId,
    state,
    framework,
    contentStatus,
  };

  const {
    isLoading,
    error,
    editorUrl,
    isEditorReady,
    openEditor,
    closeEditor,
    iframeRef,
  } = useGenericEditor({
    params,
    queryParams,
    isLargeFileUpload,
    onClose,
    onError,
  });

  // Auto-open editor on mount
  useEffect(() => {
    openEditor();
  }, [openEditor]);

  // Handle browser back button / close
  const handleClose = useCallback(() => {
    closeEditor();
  }, [closeEditor]);

  // Handle Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // Handle browser popstate (back button)
  useEffect(() => {
    const handlePopState = () => {
      handleClose();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleClose]);

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-xl">
          <h2 className="text-xl font-semibold text-red-600 font-rubik mb-3">
            Editor Error
          </h2>
          <p className="text-gray-600 mb-6 font-rubik">{error}</p>
          <button
            onClick={handleClose}
            className="w-full px-4 py-2.5 bg-sunbird-brick text-white rounded-lg font-rubik font-medium hover:opacity-90 transition-opacity"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || !isEditorReady) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sunbird-ginger/30 border-t-sunbird-ginger rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 font-rubik">
            Loading Editor...
          </h2>
          <p className="text-sm text-gray-500 font-rubik mt-1">
            Preparing the content editor
          </p>
        </div>
      </div>
    );
  }

  // Editor iframe
  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 z-[60] w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label="Close editor"
        title="Close editor"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 1L13 13M1 13L13 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Editor iframe */}
      {editorUrl && (
        <iframe
          ref={iframeRef}
          src={editorUrl}
          title="Generic Editor"
          className="w-full h-full border-0"
          allow="fullscreen"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
        />
      )}
    </div>
  );
};

export default GenericEditor;
