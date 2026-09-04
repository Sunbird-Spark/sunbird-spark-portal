import { useLocation } from 'react-router-dom';

/**
 * Resolves the "back" destination for the Learning Path overview page.
 * Reads location.state.from set by the incoming navigation (every LP entry
 * point - Home continue-learning, My Learning, Profile, search cards - already
 * sets it, mirroring the Collection flow's `useCollectionBackNavigation`).
 * Rejects another `/learning-path/...` route to prevent multi-hop back chains.
 * Falls back to /explore, safe for both authenticated and anonymous users.
 */
export function useLearningPathBackNavigation(): string {
  const location = useLocation();
  const stateFrom = (location.state as { from?: string } | null)?.from ?? '';
  return stateFrom && !stateFrom.startsWith('/learning-path/') ? stateFrom : '/explore';
}
