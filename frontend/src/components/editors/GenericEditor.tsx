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
import { useAppI18n } from '@/hooks/useAppI18n';
import PageLoader from '@/components/common/PageLoader';

export interface GenericEditorComponentProps {
  contentId?: string;
  state?: string;
  framework?: string;
  contentStatus?: string;
  isLargeFileUpload?: boolean;
  queryParams?: GenericEditorQueryParams;
  onClose?: () => void;
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

  const { t } = useAppI18n();

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

  const handleClose = useCallback(() => {
    closeEditor();
  }, [closeEditor]);

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
            {t('editors.errorTitle')}
          </h2>
          <p className="text-gray-600 mb-6 font-rubik">{error}</p>
          <button
            onClick={handleClose}
            className="w-full px-4 py-2.5 bg-sunbird-brick text-white rounded-lg font-rubik font-medium hover:opacity-90 transition-opacity"
          >
            {t('editors.goBack')}
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || !isEditorReady) {
    return <PageLoader message={t('editors.loading')} />;
  }

  // Editor iframe - fullscreen like the Angular iziModal with openFullscreen: true
  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Editor iframe */}
      {editorUrl && (
        <iframe
          id="genericEditor"
          ref={iframeRef}
          src={editorUrl}
          title={t('editors.genericEditor')}
          className="w-full h-full border-0"
          allow="fullscreen"
        />
      )}
    </div>
  );
};

export default GenericEditor;
