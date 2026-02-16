import { useState, useCallback, useRef, useEffect } from 'react';
import { GenericEditorService } from '@/services/editors/generic-editor';
import type {
  GenericEditorRouteParams,
  GenericEditorQueryParams,
  ContentDetails,
} from '@/services/editors/generic-editor';

interface UseGenericEditorOptions {
  params: GenericEditorRouteParams;
  queryParams?: GenericEditorQueryParams;
  isLargeFileUpload?: boolean;
  onClose?: () => void;
  onError?: (error: string) => void;
}

interface UseGenericEditorReturn {
  /** Whether the editor is currently loading */
  isLoading: boolean;
  /** Error message if editor failed to initialize */
  error: string | null;
  /** The URL of the generic editor to load in the iframe */
  editorUrl: string | null;
  /** Whether the editor iframe is ready and visible */
  isEditorReady: boolean;
  /** Content details fetched for the editor */
  contentDetails: ContentDetails | null;
  /** Initialize and open the editor */
  openEditor: () => Promise<void>;
  /** Close the editor and clean up */
  closeEditor: () => void;
  /** Ref for the iframe element */
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export const useGenericEditor = (
  options: UseGenericEditorOptions
): UseGenericEditorReturn => {
  const { params, queryParams, isLargeFileUpload, onClose, onError } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorUrl, setEditorUrl] = useState<string | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [contentDetails, setContentDetails] = useState<ContentDetails | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const serviceRef = useRef(new GenericEditorService());
  const lockParamsRef = useRef<GenericEditorQueryParams | undefined>(queryParams);

  const openEditor = useCallback(async () => {
    const service = serviceRef.current;
    setIsLoading(true);
    setError(null);

    try {
      let details: ContentDetails | undefined;

      // Step 1: Fetch content details if editing existing content
      if (params.contentId) {
        try {
          details = await service.getContentDetails(params.contentId);
          setContentDetails(details);
        } catch (err) {
          console.error('Failed to fetch content details:', err);
          const errMsg = 'Failed to load content details. You may not have permission to edit this content.';
          setError(errMsg);
          onError?.(errMsg);
          setIsLoading(false);
          return;
        }
      }

      // Step 2: Lock content if needed
      if (
        params.contentId &&
        service.shouldLockContent(params.state, params.contentStatus, lockParamsRef.current)
      ) {
        try {
          const userId = (await import('@/services/userAuthInfoService/userAuthInfoService')).default.getUserId() || '';
          const lockResult = await service.lockContent(
            params.contentId,
            userId,
            'User',
            params.framework,
          );
          lockParamsRef.current = lockResult;
        } catch (err: any) {
          const errCode = err?.error?.params?.err;
          if (['RESOURCE_SELF_LOCKED', 'RESOURCE_LOCKED'].includes(errCode)) {
            const errMsg = (err?.error?.params?.errmsg || 'Content is locked by another user').replace('resource', 'content');
            setError(errMsg);
            onError?.(errMsg);
          } else {
            console.warn('Failed to lock content, proceeding without lock:', err);
          }
        }
      }

      // Step 3: Build editor context and config
      const context = await service.buildEditorContext(
        params,
        details,
        isLargeFileUpload
      );
      const config = service.buildEditorConfig(lockParamsRef.current);

      // Step 4: Set window globals for the editor iframe
      service.setWindowGlobals(context, config);

      // Step 5: Set the editor URL
      const url = service.getEditorUrl();
      setEditorUrl(url);
      setIsEditorReady(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize generic editor:', err);
      const errMsg = 'Failed to initialize the editor. Please try again.';
      setError(errMsg);
      onError?.(errMsg);
      setIsLoading(false);
    }
  }, [params, isLargeFileUpload, onError]);

  const closeEditor = useCallback(() => {
    const service = serviceRef.current;

    // Retire lock if content was being edited
    const contentId = params.contentId || (window as any).context?.contentId;
    if (contentId) {
      const isDraft = params.contentStatus?.toLowerCase() === 'draft';
      const hasContentId = !!(window as any).context?.contentId;
      if (isDraft || (hasContentId && !params.contentStatus)) {
        service.retireLock(contentId).catch((err) => {
          console.warn('Failed to retire content lock:', err);
        });
      }
    }

    // Clean up
    service.clearWindowGlobals();
    setEditorUrl(null);
    setIsEditorReady(false);
    setIsLoading(false);
    setError(null);
    setContentDetails(null);
    sessionStorage.setItem('inEditor', 'false');

    onClose?.();
  }, [params.contentId, params.contentStatus, onClose]);

  // Set inEditor session flag on mount, clean up on unmount
  useEffect(() => {
    sessionStorage.setItem('inEditor', 'true');
    return () => {
      sessionStorage.setItem('inEditor', 'false');
      serviceRef.current.clearWindowGlobals();
    };
  }, []);

  return {
    isLoading,
    error,
    editorUrl,
    isEditorReady,
    contentDetails,
    openEditor,
    closeEditor,
    iframeRef,
  };
};
