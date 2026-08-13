import { useLocation } from 'react-router-dom';

/**
 * Resolves the "back" destination for editor pages.
 * Reads location.state.from set by WorkspacePage when navigating to an editor.
 * Falls back to /workspace (deep link / refresh case where no state exists).
 */
export function useEditorBackNavigation(): string {
  const location = useLocation();
  return (location.state as { from?: string } | null)?.from ?? '/workspace';
}
