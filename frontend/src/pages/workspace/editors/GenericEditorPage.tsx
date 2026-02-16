/**
 * GenericEditorPage - Route-level page that wraps the GenericEditor component.
 * Extracts route params and query params from react-router, then renders the editor.
 */

import React, { useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import GenericEditor from '@/components/editors/GenericEditor';
import { useToast } from '@/hooks/useToast';

const GenericEditorPage: React.FC = () => {
  const { contentId, state, framework, contentStatus } = useParams<{
    contentId?: string;
    state?: string;
    framework?: string;
    contentStatus?: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check if this is a large file upload route
  const isLargeFileUpload = location.pathname.includes('editorforlargecontent');

  const queryParams = {
    lockKey: searchParams.get('lockKey') || undefined,
    expiresAt: searchParams.get('expiresAt') || undefined,
    expiresIn: searchParams.get('expiresIn') || undefined,
  };

  const handleClose = useCallback(() => {
    // Navigate back to workspace
    if (state === 'collaborating-on') {
      navigate('/workspace', { replace: true });
    } else {
      navigate('/workspace', { replace: true });
    }
  }, [state, navigate]);

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
      queryParams={queryParams}
      onClose={handleClose}
      onError={handleError}
    />
  );
};

export default GenericEditorPage;
