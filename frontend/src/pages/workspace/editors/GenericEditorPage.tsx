/**
 * GenericEditorPage - Route-level page that wraps the content editor.
 * Extracts route params from react-router, then renders the native
 * @project-sunbird/generic-editor-v2 editor (GenericEditor).
 */

import React, { useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import GenericEditor from '@/components/editors/GenericEditor';
import { useToast } from '@/hooks/useToast';

const GenericEditorPage: React.FC = () => {
  const { contentId, state, framework, contentStatus } = useParams<{
    contentId?: string;
    state?: string;
    framework?: string;
    contentStatus?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const isLargeFileUpload = location.pathname.includes('editorforlargecontent');

  const handleClose = useCallback(() => {
    navigate('/workspace', { replace: true });
  }, [navigate]);

  const handleError = useCallback(
    (error: string) => {
      toast({
        title: 'Editor Error',
        description: error,
        variant: 'destructive',
      });
    },
    [toast]
  );

  return (
    <GenericEditor
      contentId={contentId}
      state={state}
      framework={framework}
      contentStatus={contentStatus}
      isLargeFileUpload={isLargeFileUpload}
      onClose={handleClose}
      onError={handleError}
    />
  );
};

export default GenericEditorPage;
