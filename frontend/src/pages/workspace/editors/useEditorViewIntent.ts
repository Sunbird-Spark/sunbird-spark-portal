import { useLocation } from 'react-router-dom';

/**
 * True when the editor was opened via the workspace "View" action rather than "Edit".
 * Reads location.state.intent set by WorkspacePage's handleView.
 */
export function useEditorViewIntent(): boolean {
  const location = useLocation();
  return (location.state as { intent?: string } | null)?.intent === 'view';
}
