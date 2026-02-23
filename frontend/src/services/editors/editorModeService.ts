import type { ApiResponse } from '@/lib/http-client';
import type { UserReadResponse } from '@/types/userTypes';

export type UserRole = 'creator' | 'reviewer' | null;
export type EditorMode = 'read' | 'review' | 'edit';

/**
 * Derives the user's workspace role from the user-read API response.
 *
 *   CONTENT_REVIEWER → 'reviewer'
 *   CONTENT_CREATOR  → 'creator'
 *   otherwise        →  null
 */
export function getUserRole(
  userData: ApiResponse<UserReadResponse> | undefined,
): UserRole {
  const roles = userData?.data?.response?.roles;
  if (!Array.isArray(roles)) return null;
  const roleNames = roles.map((r) => r?.role).filter(Boolean);
  if (roleNames.includes('CONTENT_REVIEWER')) return 'reviewer';
  if (roleNames.includes('CONTENT_CREATOR')) return 'creator';
  return null;
}

/**
 * Derives the editor mode from the content's status and the user's role.
 *
 *   FlagDraft / FlagReview        → 'read'   (flagged content, no editing)
 *   Review + creator              → 'read'   (creator cannot edit while under review)
 *   Review + reviewer             → 'review' (reviewer can act on the review)
 *   Processing                    → 'read'   (locked while processing)
 *   Live + reviewer               → 'read'   (reviewer cannot edit published content)
 *   everything else               → 'edit'   (Draft, Live for creator, Unlisted …)
 */
export function getEditorMode(
  status: string | undefined,
  userRole: UserRole,
): EditorMode {
  if (!status) return 'edit';

  switch (status) {
    case 'FlagDraft':
    case 'FlagReview':
    case 'Processing':
      return 'read';

    case 'Review':
      return userRole === 'reviewer' ? 'review' : 'read';

    case 'Live':
      if (userRole === 'reviewer') return 'read';
      return 'edit'; // Explicitly return edit for Live if not a reviewer

    default:
      return 'edit';
  }
}
