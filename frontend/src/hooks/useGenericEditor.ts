import type { RefObject } from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { GenericEditorService } from '@/services/editors/generic-editor';
import type {
  GenericEditorRouteParams,
  GenericEditorQueryParams,
  ContentDetails,
} from '@/services/editors/generic-editor';
import userAuthInfoService from '@/services/userAuthInfoService/userAuthInfoService';

interface UseGenericEditorOptions {
  params: GenericEditorRouteParams;
  queryParams?: GenericEditorQueryParams;
  isLargeFileUpload?: boolean;
  onClose?: () => void;
  onError?: (error: string) => void;
}

interface UseGenericEditorReturn {
  isLoading: boolean;
  error: string | null;
  editorUrl: string | null;
  isEditorReady: boolean;
  contentDetails: ContentDetails | null;
  openEditor: () => Promise<void>;
  closeEditor: () => void;
  iframeRef: RefObject<HTMLIFrameElement | null>;
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
  const isInitializedRef = useRef(false);

  const openEditor = useCallback(async () => {
    // Prevent double initialization
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

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

          // Validate permission
          const userId = userAuthInfoService.getUserId() || '';
          if (!service.validateRequest(details, userId, params.state)) {
            const errMsg = 'You do not have permission to edit this content.';
            setError(errMsg);
            onError?.(errMsg);
            setIsLoading(false);
            return;
          }
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
          const userId = userAuthInfoService.getUserId() || '';
          const lockResult = await service.lockContent(
            params.contentId,
            userId,
            'User',
            params.framework,
          );
          lockParamsRef.current = lockResult;
        } catch (err: any) {
          const errCode = err?.response?.data?.params?.err || err?.error?.params?.err;
          if (['RESOURCE_SELF_LOCKED', 'RESOURCE_LOCKED'].includes(errCode)) {
            const rawMsg = err?.response?.data?.params?.errmsg || err?.error?.params?.errmsg || 'Content is locked by another user';
            const errMsg = rawMsg.replace('resource', 'content');
            setError(errMsg);
            onError?.(errMsg);
            setIsLoading(false);
            return;
          }
          // Non-lock errors: proceed without lock
          console.warn('Failed to lock content, proceeding without lock:', err);
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

      // Step 5: Set the editor URL (append build number as cache buster)
      const baseUrl = service.getEditorUrl();
      const url = `${baseUrl}?${config.build_number}`;
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
    isInitializedRef.current = false;
    sessionStorage.setItem('inEditor', 'false');

    onClose?.();
  }, [params.contentId, params.contentStatus, onClose]);

  // Expose a jQuery/iziModal shim on window so the editor iframe can call
  // window.parent.$('#genericEditor').iziModal('close') without errors.
  // The editor's closeEditor handler expects this jQuery API to exist.
  useEffect(() => {
    const closeEditorRef = () => closeEditor();
    const jQueryShim = (_selector: string) => ({
      iziModal: (action: string) => {
        if (action === 'close') {
          closeEditorRef();
        }
      },
    });
    (window as any).$ = jQueryShim;
    (window as any).jQuery = jQueryShim;

    return () => {
      delete (window as any).$;
      delete (window as any).jQuery;
    };
  }, [closeEditor]);

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
