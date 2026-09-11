import { useMemo } from 'react';
import { useUserRead } from '@/hooks/useUserRead';
import { getUserRole, getEditorMode, type EditorMode } from '@/services/editors/editorModeService';
import { useContentLock } from '@/hooks/useContentLock';

export interface UseEditorLockOptions {
  contentId: string | undefined;
  metadata: Record<string, any> | null;
  /** True when the editor was opened via the workspace "View" action rather than "Edit". */
  viewIntent?: boolean;
}

export interface UseEditorLockReturn {
  editorMode: EditorMode;
  isEditMode: boolean;
  lockError: string | null;
  isLocking: boolean;
  retireLock: () => Promise<void>;
}

/**
 * Combines user role detection, editor mode resolution, and content locking
 * into a single hook used by all editor pages.
 */
export const useEditorLock = ({
  contentId,
  metadata,
  viewIntent = false,
}: UseEditorLockOptions): UseEditorLockReturn => {
  const { data: userData } = useUserRead();
  const userRole = useMemo(() => getUserRole(userData), [userData]);

  const editorMode = useMemo(
    () => getEditorMode(metadata?.status, userRole, viewIntent),
    [metadata?.status, userRole, viewIntent],
  );

  const isEditMode = editorMode === 'edit';
  const isDraft = metadata?.status?.toLowerCase() === 'draft';

  const { lockError, isLocking, retireLock } = useContentLock({
    resourceId: contentId,
    resourceType: 'Content',
    metadata,
    enabled: isEditMode && isDraft,
  });

  return { editorMode, isEditMode, lockError, isLocking, retireLock };
};
