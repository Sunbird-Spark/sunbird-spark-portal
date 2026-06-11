import { useAppInfo } from './useAppInfo';

/**
 * Whether the AI (semantic) search toggle should be shown.
 * Sourced from the backend env flag, surfaced via app-info (`enableAiSearch`).
 * Defaults to enabled when the flag is absent or app-info hasn't loaded.
 */
export const useAiSearchEnabled = (): boolean => {
  const { data, isLoading } = useAppInfo();
  if (isLoading) return false;
  return (data?.data?.enableAiSearch ?? 'true') !== 'false';
};
